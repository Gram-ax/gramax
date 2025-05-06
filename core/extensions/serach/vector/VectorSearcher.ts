import { Article, Content } from "@core/FileStructue/Article/Article";
import { getExtractHeader } from "@core/FileStructue/Article/parseContent";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import { resolveLanguage } from "@ext/localization/core/model/Language";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import Searcher, { SearchItem } from "@ext/serach/Searcher";
import { VectorArticle, VectorArticleMetadata } from "@ext/serach/vector/VectorArticle";
import VectorArticleContentParser from "@ext/serach/vector/VectorArticleContentParser";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { VectorDbApiClient } from "@ics/gx-vector-search";
import { TaskStatusInProgressResponse } from "@ics/gx-vector-search/dist/apiClient/requestTypes/taskStatus";
import { UpdateResponse } from "@ics/gx-vector-search/dist/apiClient/requestTypes/update";

interface VectorSearcherOptions {
	apiUrl: string;
	collectionName: string;
}

export class VectorSearcher implements Searcher {
	private readonly _vectorDb: VectorDbApiClient<VectorArticleMetadata>;
	private _indexingTaskIds: string[] = [];

	constructor(
		options: VectorSearcherOptions,
		private readonly _wm: WorkspaceManager,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
	) {
		this._vectorDb = new VectorDbApiClient({
			baseUrl: options.apiUrl,
			collectionName: options.collectionName,
		});

		void this.resetAllCatalogs();
		_wm.onCatalogChange((change) => {
			void this._actualizeCatalog(change.catalog);
		});
	}

	async resetAllCatalogs(): Promise<void> {
		for (const [catalogName, articles] of await this._getAllCatalogVectorArticles()) {
			this._storeTaskIdIfNeed(await this._vectorDb.updateCatalog(catalogName, articles));
		}
	}

	async searchAll(query: string, ids: { [catalogName: string]: string[] }): Promise<SearchItem[]> {
		const result: SearchItem[] = [];

		for (const catalogName in ids) {
			const searchResult = await this.search(query, catalogName, ids[catalogName]);
			result.push(...searchResult);
		}

		return result.length
			? result.sort((a, b) => {
					if (a.count === b.count) return b.score - a.score;
					return b.count - a.count;
			  })
			: null;
	}

	async search(query: string, catalogName: string, articleIds: string[]): Promise<SearchItem[]> {
		await this._cleanAndWaitIndexingTasks();

		const dbResult = await this._vectorDb.search(query, catalogName);
		return dbResult.items
			.filter((x) => articleIds.includes(x.metadata.refPath))
			.map<SearchItem>((x) => ({
				name: { end: "", targets: [{ start: x.metadata.title, target: "" }] },
				count: 1,
				score: x.score,
				paragraph: [{ prev: x.text, target: "", next: "" }],
				url: x.metadata.logicPath,
			}))
			.sort((a, b) => b.score - a.score);
	}

	private async _cleanAndWaitIndexingTasks(): Promise<void> {
		if (this._indexingTaskIds.length == 0) return;

		const retryDelayMs = 10000;
		const maxRetryCount = 1;

		for (let retryCount = 0; retryCount < maxRetryCount; retryCount++) {
			const statuses = await Promise.all(
				this._indexingTaskIds.map(async (taskId) => ({
					taskId,
					status: (await this._vectorDb.taskStatus(taskId)) ?? { done: true },
				})),
			);

			const doneTaskIds = statuses.filter((x) => x.status.done).map((x) => x.taskId);
			if (doneTaskIds.length > 0)
				this._indexingTaskIds = this._indexingTaskIds.filter((x) => !doneTaskIds.includes(x));

			const pendingTasks: {
				taskId: string;
				status: TaskStatusInProgressResponse;
			}[] = [];
			for (const element of statuses) {
				if (element.status.done == false)
					pendingTasks.push({
						taskId: element.taskId,
						status: element.status,
					});
			}

			if (pendingTasks.length == 0) break;
			await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
		}
	}

	private async _actualizeCatalog(catalog: Catalog): Promise<void> {
		const vectorArticles = await this._getVectorArticles(catalog);
		this._storeTaskIdIfNeed(await this._vectorDb.updateCatalog(catalog.name, vectorArticles));
	}

	private async _getAllCatalogVectorArticles(): Promise<[string, VectorArticle[]][]> {
		return await Promise.all(
			[...this._wm.current().getAllCatalogs().keys()].map<Promise<[string, VectorArticle[]]>>(
				async (catalogName) => {
					const catalog = await this._wm.current().getContextlessCatalog(catalogName);
					const vectorArticles = await this._getVectorArticles(catalog);
					return [catalogName, vectorArticles];
				},
			),
		);
	}

	private async _getVectorArticles(catalog: Catalog): Promise<VectorArticle[]> {
		const articles = catalog.getItems() as Article[];
		const vectorArticlesByPath: Map<string, VectorArticle> = new Map();
		for (const article of articles) {
			const parsedContent =
				(await article.parsedContent.read()) ?? (await this._parseArticleContent(article, catalog));
			const title = parsedContent ? getExtractHeader(parsedContent) ?? article.getTitle() : article.getTitle();
			const item: VectorArticle = {
				id: article.logicPath,
				title,
				children: [],
				items: parsedContent ? new VectorArticleContentParser(parsedContent.editTree.content).parse() : [],
				metadata: {
					logicPath: article.logicPath,
					refPath: article.ref.path.value,
					title,
				},
			};

			vectorArticlesByPath.set(article.logicPath, item);
		}

		const vectorArticles: VectorArticle[] = [];
		articles.forEach((article) => {
			const vectorArticle = vectorArticlesByPath.get(article.logicPath);
			if (!article.parent || !vectorArticlesByPath.has(article.parent.logicPath)) {
				vectorArticles.push(vectorArticle);
			} else {
				vectorArticlesByPath.get(article.parent.logicPath).children.push(vectorArticle);
			}
		});

		return vectorArticles;
	}

	private async _parseArticleContent(article: Article, catalog: Catalog): Promise<Content> {
		const parseCtx = await this._parserContextFactory.fromArticle(article, catalog, resolveLanguage(), true);
		try {
			return await this._parser.parse(article.content, parseCtx);
		} catch {
			return;
		}
	}

	private _storeTaskIdIfNeed(updateRes: UpdateResponse) {
		if (updateRes?.done === false) {
			this._indexingTaskIds.push(updateRes.taskId);
		}
	}
}
