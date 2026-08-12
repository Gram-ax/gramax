import Path from "@core/FileProvider/Path/Path";
import { addEvent, Level } from "@ext/loggers/opentelemetry";
import { createSearchService, type IndexFactory } from "@ext/serach/modulith/createSearchService";
import type { SearchArticleItemMetadata, SearchArticleMetadata } from "@ext/serach/modulith/SearchArticle";
import type { SearchResult as GxSearchResult } from "@ext/serach/modulith/search/ModulithSearchClient";
import { type PendingFsRequest, RpcFileProvider } from "@ext/serach/modulith/search/worker/RpcFileProvider";
import { RpcFsProvider } from "@ext/serach/modulith/search/worker/RpcFsProvider";
import type {
	SearchWorkerCommitInMessage,
	SearchWorkerFsInMessage,
	SearchWorkerGetArticlePayloadsInMessage,
	SearchWorkerInitInMessage,
	SearchWorkerInMessage,
	SearchWorkerOutMessage,
	SearchWorkerSearchBatchInMessage,
	SearchWorkerUpdateInMessage,
} from "@ext/serach/modulith/search/worker/types";
import { createSimpleError } from "@ext/serach/modulith/utils/SimpleError";
import { TrailingThrottler } from "@ext/serach/modulith/utils/TrailingThrottler";
import { ArticleIndex, type ArticleIndexArticleId, type ArticleIndexChunkId } from "@ics/article-search/data/index";
import type { FsProvider } from "@ics/article-search/fs";
import type { SearchResult, SearchResultItem, SearchService } from "@ics/article-search/search";
import { PriorityLock } from "@ics/article-search-utils";

const INDEX_FILE_NAME = "index.kv";

const PROGRESS_THROTTLE_MS = 100;

const NORMAL_PRIORITY = 0;
const HIGH_PRIORITY = 1;

const lock = new PriorityLock();
let searchService: SearchService | null = null;
let commit: () => Promise<void> | null = null;
let tenantId: string | null = null;

const fsPending = new Map<string, PendingFsRequest>();

interface GetIndexFactoryArgs {
	indexFile: Path;
	fs: FsProvider;
}

type GetIndexFactoryFn<TChunkId, TArticleId> = (args: GetIndexFactoryArgs) => IndexFactory<TChunkId, TArticleId>;

export interface HandlerContext<TChunkId = ArticleIndexChunkId, TArticleId = ArticleIndexArticleId> {
	getIndexFactory: GetIndexFactoryFn<TChunkId, TArticleId>;
	postMessage: (message: SearchWorkerOutMessage) => void;
}

export const defaultGetIndexFactory: GetIndexFactoryFn<ArticleIndexChunkId, ArticleIndexArticleId> = ({ fs }) => {
	return async (tokenizer) => {
		const index = await ArticleIndex.open(fs, INDEX_FILE_NAME, tokenizer);
		return {
			reader: index,
			writer: index,
			commit: () => index.commit(),
			close: () => Promise.resolve(),
		};
	};
};

export async function handleMessage<TChunkId, TArticleId>(
	data: SearchWorkerInMessage,
	ctx: HandlerContext<TChunkId, TArticleId>,
) {
	if (data == null) {
		addEvent("search-worker.nullish-message", Level.Commands, { received: String(data) });
		return;
	}
	try {
		const type = data.type;
		switch (type) {
			case "fs":
				return await handleFs(data);
			case "init":
				return await initSearchService(data, ctx);
			case "update":
				return await handleUpdate(data, ctx.postMessage);
			case "commit":
				return await handleCommit(data, ctx.postMessage);
			case "searchBatch":
				return await handleSearchBatch(data, ctx.postMessage);
			case "getArticlePayloads":
				return await handleGetArticlePayloads(data, ctx.postMessage);
			default:
				console.error(`Unexpected message type: ${type}`, data);
		}
	} catch (e) {
		const err = e instanceof Error ? e : new Error(String(e));
		if (!err.message) err.message = `Search worker handler failed (type=${data.type ?? "?"})`;
		ctx.postMessage({
			type: "error",
			requestId: data.requestId,
			error: createSimpleError(err),
		});
	}
}

async function handleFs(msg: SearchWorkerFsInMessage): Promise<void> {
	const pending = fsPending.get(msg.requestId);
	if (!pending) return;
	fsPending.delete(msg.requestId);
	if (msg.ok === true) pending.resolve(msg.result);
	else pending.reject(new Error("FS request failed", { cause: msg.error }));
}

async function initSearchService<TChunkId, TArticleId>(
	msg: SearchWorkerInitInMessage,
	ctx: HandlerContext<TChunkId, TArticleId>,
): Promise<void> {
	const fsRpcState = { fsPending, fsReqId: 0 };
	const rootPath = new Path(msg.articleStorageRoot);
	const articleFp = new RpcFileProvider(rootPath, "articleStorage", ctx.postMessage, fsRpcState);
	const fs = new RpcFsProvider(articleFp, new Path());

	const indexFilePath = rootPath.join(new Path(INDEX_FILE_NAME));

	const serviceAndCommit = await createSearchService<TChunkId, TArticleId, RpcFileProvider>({
		articleStorageFileProvider: articleFp,
		fs,
		indexFactory: ctx.getIndexFactory({ fs, indexFile: indexFilePath }),
	});

	searchService = serviceAndCommit.searchService;
	commit = serviceAndCommit.commit;

	tenantId = msg.tenant;

	ctx.postMessage({
		type: "ok",
		requestId: msg.requestId,
	});
}

async function handleUpdate(
	msg: SearchWorkerUpdateInMessage,
	postMessage: (message: SearchWorkerOutMessage) => void,
): Promise<void> {
	ensureSearchService();

	const release = await lock.lock(NORMAL_PRIORITY);
	try {
		const progressThrottler = new TrailingThrottler<number>(PROGRESS_THROTTLE_MS, (progress) =>
			postMessage({ type: "progress", requestId: msg.requestId, progress }),
		);

		await searchService.updateAndWait({
			tenant: tenantId,
			articles: msg.args.articles,
			filter: msg.args.filter,
			progressCallback: (p) => progressThrottler.push(p),
		});

		progressThrottler.flush();

		postMessage({
			type: "ok",
			requestId: msg.requestId,
		});
	} finally {
		release();
	}
}

async function handleCommit(
	msg: SearchWorkerCommitInMessage,
	postMessage: (message: SearchWorkerOutMessage) => void,
): Promise<void> {
	ensureSearchService();

	const release = await lock.lock(NORMAL_PRIORITY);
	try {
		await commit();
		postMessage({
			type: "ok",
			requestId: msg.requestId,
		});
	} finally {
		release();
	}
}

async function handleSearchBatch(
	msg: SearchWorkerSearchBatchInMessage,
	postMessage: (message: SearchWorkerOutMessage) => void,
): Promise<void> {
	ensureSearchService();

	const release = await lock.lock(HIGH_PRIORITY);
	try {
		const res = await searchService.search<SearchArticleMetadata, SearchArticleItemMetadata>({
			tenant: tenantId,
			items: msg.args.items.map((x) => ({
				searchText: x.query,
				filter: x.filter,
				prefixLastWord: true,
			})),
		});

		postMessage({
			type: "searchResult",
			requestId: msg.requestId,
			result: res.map((x) => transformSearchResult(x)),
		});
	} finally {
		release();
	}
}

async function handleGetArticlePayloads(
	msg: SearchWorkerGetArticlePayloadsInMessage,
	postMessage: (message: SearchWorkerOutMessage) => void,
): Promise<void> {
	ensureSearchService();

	const release = await lock.lock(NORMAL_PRIORITY);
	try {
		const res = await searchService.getArticlePayloads<SearchArticleMetadata>({
			tenant: tenantId,
			items: msg.args.items,
		});

		postMessage({
			type: "getArticlePayloads",
			requestId: msg.requestId,
			result: res,
		});
	} finally {
		release();
	}
}

const transformSearchResult = (
	res: SearchResult<SearchArticleMetadata, SearchArticleItemMetadata>[],
): GxSearchResult[] => {
	const transformItems = (items: SearchResultItem<SearchArticleItemMetadata>[]): GxSearchResult["items"] => {
		if (!items) return;

		return items.map((x) => {
			if (x.type === "block") {
				if (x.metadata?.type === "diagram") {
					return {
						type: "diagram",
						diagramType: x.metadata.diagramType,
						items: transformItems(x.items),
						title: x.title,
					};
				}

				return {
					...x,
					items: transformItems(x.items),
				};
			}

			return x;
		});
	};

	return res.map((x) => ({
		...x,
		items: transformItems(x.items),
	}));
};

function ensureSearchService(): void {
	if (!searchService || !tenantId || !commit) throw new Error("Search service is not initialized");
}
