import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import { SearchArgs, SearchStreamArgs } from "@ext/serach/ChatBotSearcher";
import {
	ModulithSearchClient,
	SearchBatchArgs,
	SearchResult,
	UpdateArgs,
} from "@ext/serach/modulith/ModulithSearchClient";
import {
	SearchArticle,
	SearchArticleArticleMetadata,
	SearchArticleFilter,
	SearchArticleMetadata,
} from "@ext/serach/modulith/SearchArticle";
import {
	ChatResponse,
	ChatStreamResponse,
	CheckAuthResponse,
	CheckResponse,
	FieldsToDotPaths,
	LegacyArticleFilter,
	RagApiClient,
	SearchResponse,
} from "@ics/gx-vector-search";
import { ProgressCallback } from "@ics/modulith-utils";

export interface RemoteModulithSearcherOptions {
	apiUrl: string;
	apiKey: string;
	collectionName: string;
}

const STATUS_POLLING_INTERVAL_MS = 500;
const STATUS_POLLING_TIMEOUT_MS = 60 * 5 * 1000; // 5 min

export class RemoteModulithSearchClient implements ModulithSearchClient {
	private readonly _apiClient: RagApiClient;

	constructor(options: RemoteModulithSearcherOptions) {
		this._apiClient = new RagApiClient({
			baseUrl: options.apiUrl,
			apiKey: options.apiKey,
			collectionName: options.collectionName,
		});
	}

	async checkConnection(): Promise<boolean> {
		const serverAvailable = await this.checkServer();
		const authAvailable = serverAvailable.ok ? await this.checkAuth() : null;

		if (!serverAvailable.ok) console.log("AI Server is not available");
		if (serverAvailable.ok && !authAvailable.ok) console.log("AI Token is invalid");

		return serverAvailable.ok && authAvailable.ok;
	}

	async checkServer(): Promise<CheckResponse> {
		return await this._apiClient.checkServer();
	}

	async checkAuth(): Promise<CheckAuthResponse> {
		return await this._apiClient.checkAuth();
	}

	async update({ articles, filter, progressCallback }: UpdateArgs): Promise<void> {
		try {
			const articlesForRemote = convertArticlesForRemote(articles);
			const res = await this._apiClient.updateArticles(articlesForRemote, convertFilterToLegacy(filter));
			if (res.done === false) await this._waitUntilDone(res.taskId, progressCallback);
		} catch (e) {
			console.error(e);
		}
	}

	async searchBatch(args: SearchBatchArgs): Promise<SearchResult[][]> {
		const dbResult = await this._searchBatchRemote(args);
		return dbResult.map((x) =>
			x.items.map<SearchResult>((y) => {
				return {
					article: y.article,
					title: [
						{
							type: "text",
							text: y.article.title,
						},
					],
					items: [
						{
							type: "paragraph",
							items: [
								{
									type: "text",
									text: y.text,
								},
							],
						},
					],
				};
			}),
		);
	}

	async chat(args: SearchArgs): Promise<ChatResponse>;
	async chat(args: SearchStreamArgs): Promise<ChatStreamResponse>;
	async chat(args: SearchArgs | SearchStreamArgs): Promise<ChatResponse | ChatStreamResponse>;
	async chat(args: SearchArgs | SearchStreamArgs): Promise<ChatResponse | ChatStreamResponse> {
		const { query, catalogName, articlesLanguage, responseLanguage, signal, stream } = args;
		const filter: LegacyArticleFilter<FieldsToDotPaths<SearchArticleMetadata>> = {
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

		try {
			const res = await this._apiClient.chat({
				query,
				language: responseLanguage,
				filter,
				stream,
				reqOptions: {
					signal,
				},
			});
			if (!res?.requestId) {
				throw new DefaultError(
					t("search.ai-search-error"),
					new Error("No items found"),
					{ showCause: true, logCause: true },
					false,
					t("search.ai-search-error-title"),
				);
			}
			return res;
		} catch (error) {
			throw new DefaultError(
				t("search.ai-search-error"),
				error,
				{ showCause: true, logCause: true },
				false,
				t("search.ai-search-error-title"),
			);
		}
	}

	private _searchBatchRemote({ items, signal }: SearchBatchArgs): Promise<SearchResponse<SearchArticleMetadata>[]> {
		return this._apiClient.searchBatch<SearchArticleMetadata>({
			items,
			reqOptions: {
				signal,
			},
		});
	}

	private async _waitUntilDone(taskId: string, progressCallback?: ProgressCallback) {
		let done: boolean = false;
		let lastProgress: number;
		const startedTime = performance.now();
		while (done === false) {
			await new Promise((resolve) => setTimeout(resolve, STATUS_POLLING_INTERVAL_MS));
			const status = await this._apiClient.taskStatus(taskId);
			done = status.done;
			const elapsedMs = performance.now() - startedTime;
			if (status.done === true || elapsedMs > STATUS_POLLING_TIMEOUT_MS) {
				return;
			}

			if (lastProgress !== status.progress) {
				progressCallback?.(status.progress);
				lastProgress = status.progress;
			}
		}
	}
}

function convertFilterToLegacy(
	filter?: SearchArticleFilter,
): LegacyArticleFilter<FieldsToDotPaths<SearchArticleMetadata>> | undefined {
	if (!filter?.metadata) {
		return undefined;
	}

	const op = filter.metadata.op;
	switch (op) {
		case "eq":
			return {
				metadata: [filter.metadata],
			};
		default:
			throw new Error(`Unexpected filter operation ${op}`);
	}
}

// TODO: add support on AI server side
//   return metadata on chat requests in links
function convertArticlesForRemote(articles: SearchArticle[]): SearchArticle[] {
	return articles
		.filter((x) => x.metadata.type === "article")
		.map((x) => ({
			...x,
			// chat request returns this id as link
			id: (x.metadata as SearchArticleArticleMetadata).logicPath,
			children: convertArticlesForRemote(x.children),
		}));
}
