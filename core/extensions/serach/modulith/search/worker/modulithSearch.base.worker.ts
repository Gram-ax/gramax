import { STORAGE_DIR_NAME } from "@app/config/const";
import Path from "@core/FileProvider/Path/Path";
import { span } from "@ext/loggers/opentelemetry";
import { createSearchService } from "@ext/serach/modulith/createSearchService";
import type { SearchArticleMetadata } from "@ext/serach/modulith/SearchArticle";
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
import type { SearchService } from "@ics/article-search/search";
import type { ProgressCallback } from "@ics/article-search-utils";
import { PriorityLock } from "@ics/article-search-utils";

const NORMAL_PRIORITY = 0;
const HIGH_PRIORITY = 1;

const lock = new PriorityLock();
let searchService: SearchService | null = null;
let commit: () => Promise<void> | null = null;
let tenantId: string | null = null;

const fsPending = new Map<string, PendingFsRequest>();

export async function handleMessage(
	data: SearchWorkerInMessage,
	postMessage: (message: SearchWorkerOutMessage) => void,
) {
	if (data == null) {
		span()?.addEvent("search-worker.nullish-message", { received: String(data) });
		return;
	}
	try {
		const type = data.type;
		switch (type) {
			case "fs":
				return await handleFs(data);
			case "init":
				return await initSearchService(data, postMessage);
			case "update":
				return await handleUpdate(data, postMessage);
			case "commit":
				return await handleCommit(data, postMessage);
			case "searchBatch":
				return await handleSearchBatch(data, postMessage);
			case "getArticlePayloads":
				return await handleGetArticlePayloads(data, postMessage);
			default:
				console.error(`Unexpected message type: ${type}`, data);
		}
	} catch (e) {
		const err = e instanceof Error ? e : new Error(String(e));
		if (!err.message) err.message = `Search worker handler failed (type=${data.type ?? "?"})`;
		postMessage({
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

async function initSearchService(
	msg: SearchWorkerInitInMessage,
	postMessage: (message: SearchWorkerOutMessage) => void,
): Promise<void> {
	const fsRpcState = { fsPending, fsReqId: 0 };
	const cacheFp = new RpcFileProvider(msg.cacheRoot, "cache", postMessage, fsRpcState);
	const articleFp = new RpcFileProvider(msg.articleStorageRoot, "articleStorage", postMessage, fsRpcState);

	const serviceAndCommit = await createSearchService<RpcFileProvider>({
		cache: {
			get: async (key) => {
				const data = await cacheFp.readAsArrayBuffer(getCachePath(key));
				return new Uint8Array(data);
			},
			set: async (key, data) => {
				await cacheFp.write(getCachePath(key), Buffer.from(data.buffer, data.byteOffset, data.byteLength));
			},
		},
		articleStorageFileProvider: articleFp,
		fsProviderFactory: (fp) => new RpcFsProvider(fp, new Path()),
	});

	searchService = serviceAndCommit.searchService;
	commit = serviceAndCommit.commit;

	tenantId = msg.tenant;

	postMessage({
		type: "ok",
		requestId: msg.requestId,
	});
}

function getCachePath(path: string): Path {
	return new Path(Path.join(STORAGE_DIR_NAME, path));
}

async function handleUpdate(
	msg: SearchWorkerUpdateInMessage,
	postMessage: (message: SearchWorkerOutMessage) => void,
): Promise<void> {
	ensureSearchService();

	const release = await lock.lock(NORMAL_PRIORITY);
	try {
		const progressCallback: ProgressCallback = (p) => {
			postMessage({
				type: "progress",
				requestId: msg.requestId,
				progress: p,
			});
		};

		await searchService.updateAndWait({
			tenant: tenantId,
			articles: msg.args.articles,
			filter: msg.args.filter,
			progressCallback,
		});

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
		const res = await searchService.search<SearchArticleMetadata>({
			tenant: tenantId,
			items: msg.args.items.map((x) => ({
				searchText: x.query,
				filter: x.filter,
			})),
		});

		postMessage({
			type: "searchResult",
			requestId: msg.requestId,
			result: res,
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

function ensureSearchService(): void {
	if (!searchService || !tenantId || !commit) throw new Error("Search service is not initialized");
}
