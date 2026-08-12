import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import type { SearchArgs, SearchStreamArgs } from "@ext/serach/ChatBotSearcher";
import type {
	RemoteSearchArticle,
	SearchArticleArticleMetadata,
	SearchArticleFilter,
	SearchArticleKey,
	SearchArticleMetadata,
} from "@ext/serach/modulith/SearchArticle";
import type { PropertyFilter } from "@ext/serach/Searcher";
import {
	andFilter,
	containsFilter,
	eqFilter,
	inFilter,
	isEmptyFilter,
	notFilter,
	orFilter,
	type ProgressCallback,
} from "@ics/article-search-utils";
import {
	type ChatResponse,
	type ChatStreamResponse,
	type CheckAuthResponse,
	type CheckResponse,
	type FieldsToDotPaths,
	type Filter,
	RagApiClient,
	type RagTaskId,
	RagTaskStatusPoller,
	waitForTaskDone,
} from "@ics/gx-vector-search";
import { SemVer } from "semver";

export interface RemoteModulithSearcherOptions {
	apiUrl: string;
	apiKey: string;
	collectionName: string;
}

export interface RemoteUpdateArgs {
	articles: RemoteSearchArticle[];
	filter?: SearchArticleFilter;
	progressCallback?: ProgressCallback;
}

const RAG_PLUGIN_NAME = "@ics/modulith-rag";
const RAG_PLUGIN_VERSION_0_0_8 = new SemVer("0.0.8");
const RAG_PLUGIN_VERSION_0_0_9 = new SemVer("0.0.9");

const STATUS_POLLING_INTERVAL_MS = 500;
const STATUS_POLLING_TIMEOUT_MS = 60 * 5 * 1000; // 5 min

export class RemoteModulithSearchClient {
	private readonly _apiClient: RagApiClient;
	private _taskStatusPoller: RagTaskStatusPoller | undefined;
	private _ragVersion: SemVer | null = null;

	private _ragGt008: boolean = false;

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
		if (serverAvailable && authAvailable) await client._init();
		return client;
	}

	get version(): SemVer | null {
		return this._ragVersion;
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

	async healthcheck() {
		return await this._apiClient.healthcheck();
	}

	async update({ articles, filter, progressCallback }: RemoteUpdateArgs): Promise<void> {
		try {
			const articlesForRemote = convertArticlesForRemote(articles);
			const res = await this._apiClient.updateArticles<SearchArticleMetadata, SearchArticleKey | string>(
				articlesForRemote,
				filter,
			);
			if (res.done === false) await this._waitUntilDone(res.taskId, progressCallback);
		} catch (e) {
			console.error(e);
		} finally {
			progressCallback?.(1);
		}
	}

	async chat(args: SearchArgs): Promise<ChatResponse>;
	async chat(args: SearchStreamArgs): Promise<ChatStreamResponse>;
	async chat(args: SearchArgs | SearchStreamArgs): Promise<ChatResponse | ChatStreamResponse>;
	async chat(args: SearchArgs | SearchStreamArgs): Promise<ChatResponse | ChatStreamResponse> {
		const {
			query,
			catalogNames,
			articlesLanguage,
			responseLanguage,
			restrictedRefPaths,
			articleRefPaths,
			propertyFilter,
			signal,
			stream,
		} = args;
		const filters: Filter<FieldsToDotPaths<SearchArticleMetadata>>[] = [];

		if (catalogNames) {
			filters.push(inFilter("catalogId", catalogNames));
		}

		if (restrictedRefPaths != null && restrictedRefPaths.length > 0) {
			filters.push(notFilter(inFilter("refPath", restrictedRefPaths)));
		}

		if (articleRefPaths != null) {
			filters.push(inFilter("refPath", articleRefPaths));
		}

		if (articlesLanguage) filters.push(eqFilter("lang", articlesLanguage));

		if (propertyFilter && this._ragGt008) {
			filters.push(convertPropertyFilter(propertyFilter));
		}

		try {
			const res = await this._apiClient.chat({
				query,
				language: responseLanguage,
				filter: {
					metadata: andFilter(filters),
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

	private async _waitUntilDone(taskId: RagTaskId, progressCallback?: ProgressCallback) {
		if (this._taskStatusPoller) {
			return await waitForTaskDone(this._taskStatusPoller, taskId, progressCallback, STATUS_POLLING_TIMEOUT_MS);
		}

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

	private async _init(): Promise<void> {
		try {
			const res = await this._apiClient.plugins();
			this._ragVersion = new SemVer(res.find((x) => x.name === RAG_PLUGIN_NAME)?.version ?? "0.0.0");
			this._ragGt008 = this._ragVersion.compare(RAG_PLUGIN_VERSION_0_0_8) >= 0;
			const ragGt009 = this._ragVersion.compare(RAG_PLUGIN_VERSION_0_0_9) >= 0;
			if (ragGt009)
				this._taskStatusPoller = new RagTaskStatusPoller({
					apiClient: this._apiClient,
					pollingIntervalMs: STATUS_POLLING_INTERVAL_MS,
				});
		} catch (error) {
			console.error(error);
			this._ragVersion = new SemVer("0.0.0");
		}
	}
}

// TODO: add support on AI server side
//   return metadata on chat requests in links
function convertArticlesForRemote(articles: RemoteSearchArticle[]): RemoteSearchArticle[] {
	return articles
		.filter((x) => x.metadata.type === "article")
		.map((x) => ({
			...x,
			// chat request returns this id as link
			id: (x.metadata as SearchArticleArticleMetadata).logicPath,
			children: convertArticlesForRemote(x.children),
		}));
}

function convertPropertyFilter(propertyFilter: PropertyFilter): Filter<FieldsToDotPaths<SearchArticleMetadata>> {
	const op = propertyFilter.op;
	switch (op) {
		case "eq": {
			return eqFilter(getPropertyKeyName(propertyFilter.key), propertyFilter.value);
		}
		case "contains": {
			return containsFilter(getPropertyKeyName(propertyFilter.key), propertyFilter.list);
		}
		case "isEmpty": {
			return isEmptyFilter(getPropertyKeyName(propertyFilter.key));
		}
		case "and": {
			return andFilter(propertyFilter.filters.map((x) => convertPropertyFilter(x)));
		}
		case "or": {
			return orFilter(propertyFilter.filters.map((x) => convertPropertyFilter(x)));
		}
		default:
			throw new Error(`Unexpected property filter operation ${op}`);
	}
}

function getPropertyKeyName(property: string): FieldsToDotPaths<SearchArticleMetadata> {
	return `properties.${property}`;
}
