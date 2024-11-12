import FileProvider from "@core/FileProvider/model/FileProvider";
import { Article } from "@core/FileStructue/Article/Article";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import { JSONContent } from "@tiptap/core";
import Path from "../../../../logic/FileProvider/Path/Path";
import { Catalog } from "../../../../logic/FileStructue/Catalog/Catalog";
import FileStructure from "../../../../logic/FileStructue/FileStructure";
import ItemExtensions from "../../../../logic/FileStructue/Item/ItemExtensions";
import ResourceExtensions from "../../../../logic/Resource/ResourceExtensions";
import SitePresenter from "../../../../logic/SitePresenter/SitePresenter";
import { getDiff, getMatchingPercent } from "../../../VersionControl/DiffHandler/DiffHandler";
import { Change } from "../../../VersionControl/DiffHandler/model/Change";
import DiffItem from "../../../VersionControl/model/DiffItem";
import DiffResource from "../../../VersionControl/model/DiffResource";
import { FileStatus } from "../../../Watchers/model/FileStatus";
import GitVersionControl from "../GitVersionControl/GitVersionControl";
import { GitStatus } from "../GitWatcher/model/GitStatus";

export default class GitDiffItemCreatorNew {
	private _gitVersionControl: GitVersionControl;
	private _fp: FileProvider;
	private _catalogHeadVersion: Catalog;

	constructor(
		private _catalog: Catalog,
		private _sp: SitePresenter,
		private _fs: FileStructure,
		private _articleParser: ArticleParser,
	) {
		this._gitVersionControl = this._catalog.repo.gvc;
		this._fp = this._fs.fp;
	}

	public async getDiffItems(): Promise<{ items: DiffItem[]; resources: DiffResource[] }> {
		if (!this._gitVersionControl) return { items: [], resources: [] };
		const [catalogHeadVersion, changeFiles] = await Promise.all([
			this._catalog.getHeadVersion(),
			this._getChangeFiles(),
		]);
		this._catalogHeadVersion = catalogHeadVersion;

		const { items: diffItems, resources } = await this._getDiffItems(changeFiles.items, changeFiles.resources);

		const renamedDiffItems = this._findRenames(diffItems);
		if (resources.length === 0) return { items: renamedDiffItems, resources: [] };

		const diffResources = await this._addDiffResources(resources, renamedDiffItems);

		return { items: renamedDiffItems, resources: diffResources };
	}

	private async _getOldContent(path: Path, isNew = false): Promise<string> {
		if (isNew) return "";
		try {
			return await this._gitVersionControl.showLastCommitContent(path);
		} catch (ex) {
			return "";
		}
	}

	private async _getNewContent(path: Path, isDelete = false): Promise<string> {
		if (isDelete) return "";
		const filePath = this._catalog.getItemRefPath(path);
		const content = (await this._fp.exists(filePath)) && (await this._fp.read(filePath));
		return content ?? "";
	}

	private async _getDiffByPath(
		path: Path,
		isNew = false,
		isDelete = false,
	): Promise<{ changes: Change[]; added: number; removed: number }> {
		const oldContent = await this._getOldContent(path, isNew);
		const newContent = await this._getNewContent(path, isDelete);
		return getDiff(oldContent, newContent);
	}

	private _findRenames(items: DiffItem[]): DiffItem[] {
		function replaceToRenamedDiffItem(
			diffItems: DiffItem[],
			removedFile: DiffItem,
			addedFile: DiffItem,
		): DiffItem[] {
			let addedIdx = 0;
			let removedIdx = 0;
			diffItems.forEach((diffItem, idx) => {
				if (!diffItem) return;
				if (diffItem.filePath.path === addedFile.filePath.path) addedIdx = idx;
				if (diffItem.filePath.path === removedFile.filePath.path) removedIdx = idx;
			});
			const addedDiffItem = diffItems[addedIdx];
			addedDiffItem.changeType = FileStatus.modified;
			addedDiffItem.diff = getDiff(removedFile.content, addedFile.content);
			addedDiffItem.headEditTree = removedFile.headEditTree;
			addedDiffItem.filePath.diff = getDiff(removedFile.filePath.path, addedDiffItem.filePath.path).changes;
			addedDiffItem.filePath.oldPath = removedFile.filePath.path;
			diffItems[addedIdx] = addedDiffItem;
			diffItems[removedIdx] = null;
			return diffItems;
		}

		const THRESHOLD = 50;
		let arrayWithRenames = [...items];
		const removedFiles = items.filter((item) => item.changeType === FileStatus.delete && item.content);
		const addedFiles = items.filter((item) => item.changeType === FileStatus.new && item.content);
		if (removedFiles.length === 0 || addedFiles.length === 0) return items;

		removedFiles.forEach((removedFile) => {
			let matching: { file: DiffItem; percent: number } = { file: null, percent: 0 };
			addedFiles.forEach((addedFile) => {
				const percent = getMatchingPercent(removedFile.content, addedFile.content);
				if (percent < THRESHOLD || percent <= matching.percent) return;
				matching = { file: addedFile, percent };
			});
			if (!matching.file) return;
			arrayWithRenames = replaceToRenamedDiffItem(arrayWithRenames, removedFile, matching.file);
		});

		return arrayWithRenames.filter((x) => x);
	}

	private async _getChangeFiles(): Promise<{
		items: GitStatus[];
		resources: GitStatus[];
	}> {
		const items: GitStatus[] = [];
		const resources: GitStatus[] = [];
		(await this._gitVersionControl.getChanges())
			.filter((c) => c.isUntracked)
			.forEach((c) => {
				if (
					c.path.allExtensions?.length &&
					ItemExtensions.includes(c.path.allExtensions[c.path.allExtensions.length - 1] ?? "")
				)
					return items.push(c);
				return resources.push(c);
			});

		return { items, resources };
	}

	private async _getDiffResource(changeFile: GitStatus, parentPath?: string): Promise<DiffResource> {
		const isNew = changeFile.status === FileStatus.new;
		const isDelete = changeFile.status === FileStatus.delete;
		const isFolder = await this._fp.isFolder(this._catalog.getItemRefPath(changeFile.path));
		return {
			parentPath,
			changeType: changeFile.status,
			type: "resource",
			isChanged: true,
			filePath: { path: changeFile.path.value },
			title: changeFile.path.nameWithExtension,
			content: isFolder ? "" : await this._getNewContent(changeFile.path),
			diff:
				ResourceExtensions.images.includes(changeFile.path.extension) || isFolder
					? null
					: await this._getDiffByPath(changeFile.path, isNew, isDelete),
		};
	}

	private async _getDiffItems(
		changeFiles: GitStatus[],
		resources: GitStatus[],
	): Promise<{ items: DiffItem[]; resources: GitStatus[] }> {
		const diffItems: DiffItem[] = [];
		for (const c of changeFiles) {
			const article = this._catalog.findItemByItemRef<Article>(
				this._fp.getItemRef(this._catalog.getItemRefPath(c.path)),
			);
			const headArticle = this._catalogHeadVersion.findItemByItemPath<Article>(
				this._catalogHeadVersion.getItemRefPath(c.path),
			);

			if (!article && !headArticle) {
				resources.push(c);
				continue;
			}

			diffItems.push(
				await this._getDiffItemByArticle({
					article,
					headArticle,
					isNew: c.status === FileStatus.new,
					isDelete: c.status === FileStatus.delete,
					isChanged: true,
				}),
			);
		}
		return { items: diffItems.filter((c) => c), resources };
	}

	private async _getDiffItemByArticle({
		article,
		headArticle,
		isChanged,
		isNew = false,
		isDelete = false,
		resources = [],
	}: {
		article: Article;
		headArticle: Article;
		isChanged: boolean;
		isNew?: boolean;
		isDelete?: boolean;
		resources?: DiffResource[];
	}): Promise<DiffItem> {
		let changeType: FileStatus = FileStatus.modified;
		if (isNew) changeType = FileStatus.new;
		else if (isDelete) changeType = FileStatus.delete;

		if (changeType === FileStatus.modified) {
			const relativeRepPath = this._catalog.getRelativeRepPath(article.ref);
			let headEditTree: JSONContent;
			if (isChanged) {
				if (!headArticle.parsedContent) await this._articleParser.parse(headArticle, this._catalogHeadVersion);
				headEditTree = headArticle.parsedContent?.editTree;
			} else {
				if (!article.parsedContent) await this._articleParser.parse(article, this._catalog);
				headEditTree = article.parsedContent?.editTree;
			}

			return {
				type: "item",
				changeType,
				title: article.getTitle(),
				logicPath: await this._catalog.getPathname(article),
				filePath: { path: relativeRepPath.value },
				content: await this._getNewContent(relativeRepPath),
				diff: await this._getDiffByPath(relativeRepPath, isNew, isDelete),
				resources,
				isChanged,
				headEditTree,
			};
		} else if (changeType === FileStatus.delete) {
			const relativeRepPath = this._catalogHeadVersion.getRelativeRepPath(headArticle.ref);
			if (!headArticle.parsedContent) await this._articleParser.parse(headArticle, this._catalogHeadVersion);
			const headEditTree = headArticle.parsedContent?.editTree;
			return {
				type: "item",
				changeType,
				title: headArticle.getTitle(),
				logicPath: await this._catalogHeadVersion.getPathname(headArticle),
				filePath: { path: relativeRepPath.value },
				content: await this._getOldContent(relativeRepPath),
				diff: await this._getDiffByPath(relativeRepPath, isNew, isDelete),
				resources,
				isChanged,
				headEditTree,
			};
		} else if (changeType === FileStatus.new) {
			const relativeRepPath = this._catalog.getRelativeRepPath(article.ref);
			return {
				type: "item",
				changeType,
				title: article.getTitle(),
				logicPath: await this._catalog.getPathname(article),
				filePath: { path: relativeRepPath.value },
				content: await this._getNewContent(relativeRepPath),
				diff: await this._getDiffByPath(relativeRepPath, isNew, isDelete),
				resources,
				isChanged,
			};
		}
	}

	private async _addDiffResources(changeResources: GitStatus[], diffItems: DiffItem[]): Promise<DiffResource[]> {
		const res: Set<DiffResource> = new Set();
		this._catalog = await this._sp.parseAllItems(this._catalog);
		const articles: { article: Article; catalog: Catalog }[] = this._catalog
			.getContentItems()
			.map((a) => ({ article: a, catalog: this._catalog }));

		const haveDeletions = changeResources.some((c) => c.status === FileStatus.delete);
		if (haveDeletions) {
			this._catalogHeadVersion = await this._sp.parseAllItems(this._catalogHeadVersion);
			articles.push(
				...this._catalogHeadVersion
					.getContentItems()
					.map((a) => ({ article: a, catalog: this._catalogHeadVersion })),
			);
		}

		for (const changeResource of changeResources) {
			let includes = false;
			let parentPath: string;
			for (const { article, catalog } of articles) {
				if (!article.parsedContent) continue;
				const linkManager = article.parsedContent.linkManager;
				const resourceManager = article.parsedContent.resourceManager;
				for (const path of [...resourceManager.resources, ...linkManager.resources]) {
					if (resourceManager.getAbsolutePath(path).endsWith(changeResource.path)) {
						parentPath = catalog.getRelativeRepPath(article.ref).value;
						const diffResource = await this._getDiffResource(changeResource, parentPath);
						for (const diffItem of diffItems) {
							// если ресурс удален, он может быть прикреплен только к удаленной статьи
							if (
								changeResource.status === FileStatus.delete &&
								diffItem.changeType !== FileStatus.delete
							)
								continue;
							const diffItemResourcePaths = diffItem.resources.map((resource) => resource.filePath.path);
							if (
								!diffItemResourcePaths.includes(diffResource.filePath.path) &&
								diffItem.logicPath === (await catalog.getPathname(article))
							) {
								diffItem.resources.push(diffResource);
								includes = true;
							}
						}

						// если ресурс удален и не прикреплен ни к одной удаленной статье, то оставляем как ресурс
						if (!includes && changeResource.status !== FileStatus.delete) {
							includes = true;
							diffItems.push(
								await this._getDiffItemByArticle({
									article: article,
									headArticle: null,
									isChanged: false,
									resources: [diffResource],
								}),
							);
						}
					}
				}
			}
			if (!includes) res.add(await this._getDiffResource(changeResource, parentPath));
		}

		return Array.from(res);
	}
}
