import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import type { SearchArgs, SearchStreamArgs } from "@ext/serach/ChatBotSearcher";
import type {
	SearchArticle,
	SearchArticleArticleMetadata,
	SearchArticleFilter,
	SearchArticleKey,
	SearchArticleMetadata,
} from "@ext/serach/modulith/SearchArticle";
import type { UpdateArgs } from "@ext/serach/modulith/search/ModulithSearchClient";
import {
	type ArticleFilter,
	type ChatResponse,
	type ChatStreamResponse,
	type CheckAuthResponse,
	type CheckResponse,
	type EqFilter,
	type FieldsToDotPaths,
	type Filter,
	type LegacyArticleFilter,
	RagApiClient,
} from "@ics/gx-vector-search";
import type { ProgressCallback } from "@ics/modulith-utils";
import { SemVer } from "semver";

export interface RemoteModulithSearcherOptions {
	apiUrl: string;
	apiKey: string;
	collectionName: string;
}

const RAG_PLUGIN_NAME = "@ics/modulith-rag";
const RAG_PLUGIN_VERSION_0_0_6 = new SemVer("0.0.6");

const STATUS_POLLING_INTERVAL_MS = 500;
const STATUS_POLLING_TIMEOUT_MS = 60 * 5 * 1000; // 5 min

export class RemoteModulithSearchClient {
	private readonly _apiClient: RagApiClient;
	private _ragVersion: SemVer | null = null;

	private constructor(options: RemoteModulithSearcherOptions) {
		this._apiClient = new RagApiClient({
			baseUrl: options.apiUrl,
			apiKey: options.apiKey,
			collectionName: options.collectionName,
		});
	}

	static async create(options: RemoteModulithSearcherOptions): Promise<RemoteModulithSearchClient> {
		const client = new RemoteModulithSearchClient(options);
		const { serverAvailable, authAvailable } = await client._checkConnectionImpl();
		if (serverAvailable && authAvailable) await client._initRagVersion();
		return client;
	}

	async checkConnection(): Promise<boolean> {
		const { serverAvailable, authAvailable } = await this._checkConnectionImpl();

		if (!serverAvailable) console.log("AI Server is not available");
		if (serverAvailable && !authAvailable) console.log("AI Token is invalid");

		return serverAvailable && authAvailable;
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
			const res = await this._apiClient.updateArticles<SearchArticleMetadata, SearchArticleKey | string>(
				articlesForRemote,
				this._processFilter(filter),
			);
			if (res.done === false) await this._waitUntilDone(res.taskId, progressCallback);
		} catch (e) {
			console.error(e);
		}
	}

	async chat(args: SearchArgs): Promise<ChatResponse>;
	async chat(args: SearchStreamArgs): Promise<ChatStreamResponse>;
	async chat(args: SearchArgs | SearchStreamArgs): Promise<ChatResponse | ChatStreamResponse>;
	async chat(args: SearchArgs | SearchStreamArgs): Promise<ChatResponse | ChatStreamResponse> {
		const { query, catalogNames, articlesLanguage, responseLanguage, restrictedLogicPaths, signal, stream } = args;
		const filters: Filter<FieldsToDotPaths<SearchArticleMetadata>>[] = [];

		if (catalogNames) {
			if (catalogNames.length <= 1) {
				filters.push({
					op: "eq",
					key: "catalogId",
					value: catalogNames[0] ?? null,
				});
			} else if (this._ragVersion.compare(RAG_PLUGIN_VERSION_0_0_6) >= 0) {
				filters.push({
					op: "in",
					key: "catalogId",
					list: catalogNames,
				});
			}
		}

		if (
			restrictedLogicPaths != null &&
			restrictedLogicPaths.length > 0 &&
			this._ragVersion.compare(RAG_PLUGIN_VERSION_0_0_6) >= 0
		) {
			filters.push({
				op: "not",
				filter: {
					op: "in",
					key: "logicPath",
					list: restrictedLogicPaths,
				},
			});
		}

		if (articlesLanguage)
			filters.push({
				op: "eq",
				key: "lang",
				value: articlesLanguage,
			});

		try {
			const res = await this._apiClient.chat({
				query,
				language: responseLanguage,
				filter: {
					metadata: {
						op: "and",
						filters: filters,
					},
				},
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
			if (error instanceof DOMException && error.name === "AbortError") {
				throw error;
			}

			throw new DefaultError(
				t("search.ai-search-error"),
				error,
				{ showCause: true, logCause: true },
				false,
				t("search.ai-search-error-title"),
			);
		}
	}

	private async _checkConnectionImpl(): Promise<{ serverAvailable: boolean; authAvailable: boolean }> {
		const serverAvailable = await this.checkServer();
		const authAvailable = serverAvailable.ok ? await this.checkAuth() : null;
		return { serverAvailable: serverAvailable.ok, authAvailable: authAvailable?.ok ?? false };
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

	private _processFilter(
		filter?: SearchArticleFilter,
	): ArticleFilter<SearchArticleKey> | LegacyArticleFilter<string> {
		if (this._ragVersion.compare(RAG_PLUGIN_VERSION_0_0_6) >= 0) {
			return filter;
		}

		return convertFilterToLegacy(filter);
	}

	private async _initRagVersion(): Promise<void> {
		try {
			const res = await this._apiClient.plugins();
			this._ragVersion = new SemVer(res.find((x) => x.name === RAG_PLUGIN_NAME)?.version ?? "0.0.0");
		} catch (error) {
			console.error(error);
			this._ragVersion = new SemVer("0.0.0");
		}
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

function convertFilterToLegacy(filter?: SearchArticleFilter): LegacyArticleFilter<string> | undefined {
	if (!filter?.metadata) {
		return undefined;
	}

	const op = filter.metadata.op;
	switch (op) {
		case "eq":
			return {
				metadata: [
					{
						op: "eq",
						key: filter.metadata.key.join("."),
						value: filter.metadata.value,
					},
				],
			};
		case "and":
			return {
				metadata: filter.metadata.filters.map<EqFilter<string>>((x) => {
					if (x.op !== "eq") {
						// TODO: error "Update AI server"
						throw new Error(`Unexpected filter operation ${x.op}`);
					}

					return {
						op: "eq",
						key: x.key.join("."),
						value: x.value,
					};
				}),
			};
		default:
			throw new Error(`Unexpected filter operation ${op}`);
	}
}
