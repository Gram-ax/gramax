import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { EnterpriseWorkspace } from "@ext/enterprise/EnterpriseWorkspace";
import { getResourceConfig } from "@ext/enterprise/notifications/getResourceConfig";
import { NotificationState } from "@ext/enterprise/notifications/types";
import type GitStorageData from "@ext/git/core/model/GitStorageData";
import type { GitVersion } from "@ext/git/core/model/GitVersion";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import { span, trace } from "@ext/loggers/opentelemetry";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import extractPreviewFromEditTree from "@ext/markdown/elementsUtils/extractPreviewFromEditTree";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

interface ArticleNotificationInfo {
	title: string;
	logicPath: string;
	previewText?: string;
	state: string;
	groups: string[];
	users: string[];
}

export default class MergeNotificationHandler implements EventHandlerCollection {
	private _processedMerges = new Set<string>();

	constructor(
		private _workspace: EnterpriseWorkspace,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
	) {}

	@trace()
	mount(): void {
		this._workspace.events.on("merge", async ({ catalog, targetBranch, sourceData, beforeMergeCommit }) => {
			const parser = this._parser;
			const parserContextFactory = this._parserContextFactory;
			const mergeKey = `${catalog.name}:${beforeMergeCommit.toString()}`;
			if (this._processedMerges.has(mergeKey)) return;
			this._processedMerges.add(mergeKey);
			const gesUrl = this._workspace.getGesUrl();
			if (!gesUrl) return;

			try {
				const changes = await this._getMergedFileChanges(
					catalog,
					targetBranch,
					sourceData,
					beforeMergeCommit,
					gesUrl,
				);
				if (!changes) return;

				const articles = await this._collectNotifiableArticles(
					catalog,
					changes.fileStatusMap,
					parser,
					parserContextFactory,
				);
				if (articles.length === 0) return;

				const token = (sourceData as { token?: string }).token;
				await this._dispatchNotifications(articles, catalog.name, gesUrl, token);
			} catch (e) {
				span()?.addEvent("error", { error: String(e) });
			} finally {
				this._processedMerges.delete(mergeKey);
			}
		});
	}

	private _shouldSendNotification(state: string, fileStatus: FileStatus): boolean {
		switch (state) {
			case NotificationState.OnCreate:
				return fileStatus === FileStatus.new;
			case NotificationState.OnChange:
				return fileStatus === FileStatus.modified;
			case NotificationState.OnBoth:
				return fileStatus === FileStatus.new || fileStatus === FileStatus.modified;
			case NotificationState.Disabled:
				return false;
			default:
				return false;
		}
	}

	private async _getMergedFileChanges(
		catalog: Catalog,
		targetBranch: string,
		sourceData: SourceData,
		beforeMergeCommit: GitVersion,
		gesUrl: string,
	): Promise<{ fileStatusMap: Map<string, FileStatus>; mainBranch: string } | null> {
		const storage = catalog.repo.storage;
		const storageData = (await storage.getStorageData(sourceData)) as GitStorageData;
		const resourceId = `${storageData.group}/${storageData.name}`;
		const resourceConfig = await getResourceConfig(gesUrl, resourceId);
		const mainBranch = resourceConfig?.mainBranch;

		if (!mainBranch || targetBranch !== mainBranch) return null;

		const mainBranchAfterMerge = await catalog.repo.gvc.getHeadCommit(mainBranch);
		const diffResult = await catalog.repo.gvc.diff({
			compare: { type: "tree", old: beforeMergeCommit, new: mainBranchAfterMerge },
			renames: true,
			useMergeBase: false,
		});

		if (diffResult.files.length === 0) return null;

		const fileStatusMap = new Map<string, FileStatus>();
		for (const file of diffResult.files) {
			fileStatusMap.set(file.path.value, file.status);
		}

		return { fileStatusMap, mainBranch };
	}

	private async _collectNotifiableArticles(
		catalog: Catalog,
		fileStatusMap: Map<string, FileStatus>,
		parser: MarkdownParser,
		parserContextFactory: ParserContextFactory,
	): Promise<ArticleNotificationInfo[]> {
		const catalogName = catalog.name;
		const result: ArticleNotificationInfo[] = [];

		for (const [filePath, fileStatus] of fileStatusMap.entries()) {
			const fullPath = new Path(catalogName).join(new Path(filePath));
			const article = catalog.findItemByItemPath<Article>(fullPath);
			if (!article) continue;

			const notifications = article.props?.notifications;
			if (!notifications || notifications.state === NotificationState.Disabled) continue;
			if (!this._shouldSendNotification(notifications.state, fileStatus)) continue;

			const previewText = await this._extractPreview(article, catalog, parser, parserContextFactory);

			result.push({
				title: article.props?.title,
				logicPath: article.logicPath,
				previewText,
				state: notifications.state,
				groups: notifications.groups,
				users: notifications.users,
			});
		}

		return result;
	}

	private async _extractPreview(
		article: Article,
		catalog: Catalog,
		parser: MarkdownParser,
		parserContextFactory: ParserContextFactory,
	): Promise<string> {
		const language = convertContentToUiLanguage(catalog.props?.language);
		const context = await parserContextFactory.fromArticle(article, catalog, language);
		const content = await parser.parse(article.content, context);
		return extractPreviewFromEditTree(content.editTree, 101);
	}

	private async _dispatchNotifications(
		articles: ArticleNotificationInfo[],
		catalogName: string,
		gesUrl: string,
		token: string | undefined,
	): Promise<void> {
		await Promise.all(
			articles.map(async (articleInfo) => {
				const response = await fetch(`${gesUrl}/enterprise/notifications/send`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(token && { Authorization: `Bearer ${token}` }),
					},
					body: JSON.stringify({
						recipients: { groups: articleInfo.groups, users: articleInfo.users },
						notification: {
							articleTitle: articleInfo.title,
							articlePath: articleInfo.logicPath,
							catalogName,
							previewText: articleInfo.previewText,
						},
					}),
				});

				if (!response.ok) return;

				await response.json();
			}),
		);
	}
}
