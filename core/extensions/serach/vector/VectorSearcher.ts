import { Article, Content } from "@core/FileStructue/Article/Article";
import { getExtractHeader } from "@core/FileStructue/Article/parseContent";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import { resolveLanguage } from "@ext/localization/core/model/Language";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import Searcher, { SearchItem } from "@ext/serach/Searcher";
import { GramaxCatalog, GramaxCatalogItem } from "@ext/serach/vector/GramaxCatalog";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { Chunk, ChunkFactory, VectorDbApiClient } from "@ics/gx-vector-search";
import { TaskStatusInProgressResponse } from "@ics/gx-vector-search/dist/apiClient/requestTypes/taskStatus";
import { UpdateResponse } from "@ics/gx-vector-search/dist/apiClient/requestTypes/update";

interface VectorSearcherOptions {
	apiUrl: string;
	collectionName: string;
}

export class VectorSearcher implements Searcher {
	private readonly _vectorDb: VectorDbApiClient;
	private readonly _chunkFactory = new ChunkFactory();
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

		this.resetAllCatalogs();
		_wm.onCatalogChange((change) => {
			this._actualizeCatalog(change.catalog);
		});
	}

	async resetAllCatalogs(): Promise<void> {
		for (const [catalogName, chunks] of await this._getAllCatalogChunks()) {
			this._storeTaskIdIfNeed(await this._vectorDb.updateCatalog(catalogName, chunks));
		}
	}

	async searchAll(query: string, ids: { [catalogName: string]: string[] }): Promise<SearchItem[]> {
		let result: SearchItem[] = [];

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

		const catalog = await this._wm.current().getContextlessCatalog(catalogName);
		const catalogToParse = await this._getVectorCatalog(catalog, articleIds);

		const result: any[] = [];
		dbResult?.result?.forEach((item) => {
			const article = catalogToParse.getAllArticles().find((a) => a.getId() === item.payload.articleId);
			if (!article) return;
			const block = article.getBlocks().find((b) => b.getId() === item.payload.id);
			if (!block) return;

			result.push({
				article: article.getModel().title,
				path: article.getModel().path,
				block: block.getPlainText(),
				score: item.score,
			});
		});

		return result
			.map<SearchItem>((r) => {
				return {
					name: { end: "", targets: [{ start: r.article, target: "" }] },
					count: 1,
					score: r.score,
					paragraph: [{ prev: r.block, target: "", next: "" }],
					url: r.path,
				};
			})
			.sort((a, b) => b.score - a.score);
	}

	private async _cleanAndWaitIndexingTasks(): Promise<void> {
		if (this._indexingTaskIds.length == 0) return;

		const retryDelayMs = 10000;
		let maxRetryCount = 1;

		for (let retryCount = 0; retryCount < maxRetryCount; retryCount++) {
			const statuses = await Promise.all(
				this._indexingTaskIds.map(async (taskId) => ({
					taskId,
					status: await this._vectorDb.taskStatus(taskId) ?? { done: true },
				})),
			);

			const doneTaskIds = statuses.filter((x) => x.status.done).map((x) => x.taskId);
			if (doneTaskIds.length > 0)
				this._indexingTaskIds = this._indexingTaskIds.filter((x) => !doneTaskIds.includes(x));

			let pendingTasks: {
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
		const chunks = await this._getCatalogChunks(catalog);
		this._storeTaskIdIfNeed(await this._vectorDb.updateCatalog(catalog.name, chunks));
	}

	private async _getAllCatalogChunks(): Promise<[string, Chunk[]][]> {
		return await Promise.all(
			[...this._wm.current().getAllCatalogs().keys()].map<Promise<[string, Chunk[]]>>(async (catalogName) => {
				const catalog = await this._wm.current().getContextlessCatalog(catalogName);
				const chunks = await this._getCatalogChunks(catalog);
				return [catalogName, chunks];
			}),
		);
	}

	private async _getCatalogChunks(catalog: Catalog): Promise<Chunk[]> {
		return this._chunkFactory.createFromCatalog(await this._getVectorCatalog(catalog));
	}

	private async _getVectorCatalog(catalog: Catalog, articleIds?: string[]): Promise<GramaxCatalog> {
		const articles = catalog.getItems() as Article[];
		const parsedItemsByArticle: Map<string, GramaxCatalogItem> = new Map();
		const items: GramaxCatalogItem[] = [];
		for (const article of articles) {
			if (articleIds && !articleIds.includes(article.ref.path.value)) continue;

			const parsedContent =
				(await article.parsedContent.read()) ?? (await this._parseArticleContent(article, catalog));
			if (!parsedContent) continue;

			const item = {
				parsedContent: parsedContent,
				parent: article.parent ? parsedItemsByArticle.get(article.parent.logicPath) ?? null : null,
				content: article.content,
				path: article.logicPath,
				title: article.getTitle() ?? getExtractHeader(parsedContent),
			};

			parsedItemsByArticle.set(article.logicPath, item);
			items.push(item);
		}

		return new GramaxCatalog(items, catalog.name);
	}

	private async _parseArticleContent(article: Article, catalog: Catalog): Promise<Content> {
		const parseCtx = this._parserContextFactory.fromArticle(article, catalog, resolveLanguage(), true);
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
