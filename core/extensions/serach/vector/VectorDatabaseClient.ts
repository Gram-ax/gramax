import { Article, Content } from "@core/FileStructue/Article/Article";
import { getExtractHeader } from "@core/FileStructue/Article/parseContent";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import Localizer from "@ext/localization/core/Localizer";
import { ContentLanguage, resolveLanguage } from "@ext/localization/core/model/Language";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import { withRetries } from "@ext/serach/vector/utils/withRetries";
import { ArticleLanguage, VectorArticle, VectorArticleMetadata } from "@ext/serach/vector/VectorArticle";
import VectorArticleContentParser from "@ext/serach/vector/VectorArticleContentParser";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import {
	ChatResponse,
	CheckAuthResponse,
	CheckResponse,
	Filter,
	RagApiClient,
	SearchResponse,
	TaskStatusInProgressResponse,
	UpdateResponse,
} from "@ics/gx-vector-search";

export interface VectorDatabaseClientOptions {
	apiUrl: string;
	apiKey: string;
	collectionName: string;
}

type TaskId = string;

interface PendingTask {
	taskId: TaskId;
	status: TaskStatusInProgressResponse;
}

export default class VectorDatabaseClient {
	private readonly _vectorApiClient: RagApiClient;
	private _indexingTaskIds: TaskId[] = [];

	constructor(
		options: VectorDatabaseClientOptions,
		private readonly _wm: WorkspaceManager,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
	) {
		this._vectorApiClient = new RagApiClient({
			baseUrl: options.apiUrl,
			apiKey: options.apiKey,
			collectionName: options.collectionName,
		});

		_wm.onCatalogChange((change) => {
			void this._actualizeCatalog(change.catalog);
		});
		_wm.maybeCurrent()?.events?.on?.("add-catalog", ({ catalog }) => {
			void this._actualizeCatalog(catalog);
		});
		void this._readAllCatalogs(); // read all catalogs
	}

	async chat(
		query: string,
		responseLanguage: ContentLanguage,
		articlesLanguage: ArticleLanguage,
		catalogName?: string,
	): Promise<ChatResponse> {
		const filter: Filter = {
			metadata: [],
		};

		if (catalogName)
			filter.metadata.push({
				op: "eq",
				key: "catalogId",
				value: catalogName,
			});

		if (articlesLanguage)
			filter.metadata.push({
				op: "eq",
				key: "lang",
				value: articlesLanguage,
			});

		return await this._vectorApiClient.chat(query, responseLanguage, filter);
	}

	async checkConnection(): Promise<boolean> {
		const serverAvailable = await this.checkServer();
		const authAvailable = serverAvailable.ok ? await this.checkAuth() : null;

		if (!serverAvailable.ok) console.log("AI Server is not available");
		if (serverAvailable.ok && !authAvailable.ok) console.log("AI Token is invalid");

		return serverAvailable.ok && authAvailable.ok;
	}

	async checkServer(): Promise<CheckResponse> {
		return await this._vectorApiClient.checkServer();
	}

	async checkAuth(): Promise<CheckAuthResponse> {
		return await this._vectorApiClient.checkAuth();
	}

	async search(query: string, catalogName: string): Promise<SearchResponse<VectorArticleMetadata>> {
		await this._cleanAndWaitIndexingTasks();
		return this._vectorApiClient.search(query, {
			metadata: [
				{
					op: "eq",
					key: "catalogId",
					value: catalogName,
				},
			],
		});
	}

	async updateAllCatalogs(): Promise<void> {
		for (const [catalogName, articles] of await this._getAllCatalogVectorArticles()) {
			this._storeTaskIdIfNeed(
				await this._vectorApiClient.updateArticles(articles, {
					metadata: [
						{
							op: "eq",
							key: "catalogId",
							value: catalogName,
						},
					],
				}),
			);
		}
	}

	private async _cleanAndWaitIndexingTasks(): Promise<void> {
		if (this._indexingTaskIds.length == 0) return;

		withRetries(async () => {
			const statuses = await Promise.all(
				this._indexingTaskIds.map(async (taskId) => ({
					taskId,
					status: (await this._vectorApiClient.taskStatus(taskId)) ?? { done: true },
				})),
			);

			const doneTaskIds = statuses.filter((x) => x.status.done).map((x) => x.taskId);
			if (doneTaskIds.length > 0)
				this._indexingTaskIds = this._indexingTaskIds.filter((x) => !doneTaskIds.includes(x));

			const pendingTasks: PendingTask[] = [];
			for (const element of statuses) {
				if (element.status.done == false)
					pendingTasks.push({
						taskId: element.taskId,
						status: element.status,
					});
			}

			if (pendingTasks.length == 0) return { type: "break" };
		});
	}

	private async _actualizeCatalog(catalog: Catalog): Promise<void> {
		const vectorArticles = await this._getVectorArticles(catalog);
		const filter: Filter = {
			metadata: [
				{
					op: "eq",
					key: "catalogId",
					value: catalog.name,
				},
			],
		};
		const updateResp = await this._vectorApiClient.updateArticles(vectorArticles, filter);
		this._storeTaskIdIfNeed(updateResp);
	}

	private async _readAllCatalogs() {
		const catalogNames = [...this._wm.current().getAllCatalogs().keys()];
		for (const catalogName of catalogNames) {
			await this._wm.current().getContextlessCatalog(catalogName);
		}
	}

	private async _getAllCatalogVectorArticles(): Promise<[string, VectorArticle[]][]> {
		const catalogNames = [...this._wm.current().getAllCatalogs().keys()];
		const promises = catalogNames.map<Promise<[string, VectorArticle[]]>>(async (catalogName) => {
			const catalog = await this._wm.current().getContextlessCatalog(catalogName);
			const vectorArticles = await this._getVectorArticles(catalog);
			return [catalogName, vectorArticles];
		});
		return await Promise.all(promises);
	}

	private async _getVectorArticles(catalog: Catalog): Promise<VectorArticle[]> {
		const articles = catalog.getItems() as Article[];
		const vectorArticlesByPath: Map<string, VectorArticle> = new Map();

		const promises = articles.map(async (article) => {
			const vectorArticle = await this._createVectorArticle(catalog, article);
			vectorArticlesByPath.set(article.logicPath, vectorArticle);
		});
		await Promise.all(promises);

		const vectorArticles: VectorArticle[] = [];
		articles.forEach((article) => {
			const vectorArticle = vectorArticlesByPath.get(article.logicPath);
			if (!article.parent || !vectorArticlesByPath.has(article.parent.logicPath))
				vectorArticles.push(vectorArticle);
			else vectorArticlesByPath.get(article.parent.logicPath).children.push(vectorArticle);
		});

		return vectorArticles;
	}

	private async _createVectorArticle(catalog: Catalog, article: Article): Promise<VectorArticle> {
		const getSnippetItems = async (id: string) => {
			const snippetContent = catalog.customProviders.snippetProvider.getArticle(id)?.parsedContent;
			if (!snippetContent) return null;
			return (await snippetContent.read()).editTree.content;
		};

		const getPropertyValue = (id: string) => {
			const prop = article.props?.properties?.find((x) => x.name === id);
			return prop?.value?.join(", ");
		};

		const parsedContent = await this._parseArticleContent(article, catalog);
		const title = parsedContent ? getExtractHeader(parsedContent) ?? article.getTitle() : article.getTitle();
		const item: VectorArticle = {
			id: article.logicPath,
			title,
			children: [],
			items: parsedContent
				? await new VectorArticleContentParser(
						parsedContent.editTree.content,
						getSnippetItems,
						getPropertyValue,
				  ).parse()
				: [],
			metadata: {
				catalogId: catalog.name,
				refPath: article.ref.path.value,
				lang: Localizer.extract(Localizer.sanitize(article.logicPath)) ?? catalog.props.language ?? "none",
				properties: article.props.properties
					? Object.fromEntries(article.props.properties.map((x) => [x.name, x.value]))
					: {},
			},
		};

		return item;
	}

	private async _parseArticleContent(article: Article, catalog: Catalog): Promise<Content | undefined> {
		const parsed = await article.parsedContent.read();
		if (parsed) return parsed;

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
