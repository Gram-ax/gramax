import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { createSearchService } from "@ext/serach/modulith/createSearchService";
import type { SearchArticleMetadata } from "@ext/serach/modulith/SearchArticle";
import type {
	FsRequestMethod,
	FsScope,
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
import type { SearchService } from "@ics/modulith-search-domain/search";
import type { ProgressCallback } from "@ics/modulith-utils";
import { PriorityLock } from "@ics/modulith-utils";

const NORMAL_PRIORITY = 0;
const HIGH_PRIORITY = 1;

type PendingFsRequest = {
	resolve: (value: unknown) => void;
	reject: (reason: unknown) => void;
};

const lock = new PriorityLock();
let searchService: SearchService | null = null;
let commit: () => Promise<void> | null = null;
let tenantId: string | null = null;

let fsReqId = 0;
const fsPending = new Map<string, PendingFsRequest>();

export async function handleMessage(
	data: SearchWorkerInMessage,
	postMessage: (message: SearchWorkerOutMessage) => void,
) {
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
		postMessage({
			type: "error",
			requestId: data.requestId,
			error: createSimpleError(err),
		});
	}
}

class RpcFileProvider implements FileProvider {
	private readonly _root: Path;

	constructor(
		root: string,
		private readonly _scope: FsScope,
		private readonly _postMessage: (message: SearchWorkerOutMessage) => void,
	) {
		this._root = new Path(root);
	}

	get storageId(): string {
		return this._throwNotImplemented("storageId");
	}

	get rootPath(): Path {
		return this._throwNotImplemented("rootPath");
	}

	get isReadOnly(): boolean {
		return this._throwNotImplemented("isReadOnly");
	}

	get isFallbackOnRoot(): boolean {
		return this._throwNotImplemented("isFallbackOnRoot");
	}

	async isRootPathExists(): Promise<boolean> {
		return this._callFs("isRootPathExists", { path: "" });
	}

	exists(path: Path): Promise<boolean> {
		return this._callFs("exists", { path: this._toFsPath(path) });
	}

	async read(path: Path): Promise<string> {
		return this._callFs("read", { path: this._toFsPath(path) });
	}

	async readdir(path: Path): Promise<string[]> {
		return this._callFs("readdir", { path: this._toFsPath(path) });
	}

	async delete(path: Path): Promise<void> {
		await this._callFs("delete", { path: this._toFsPath(path) });
	}

	async write(path: Path, data: string | Buffer): Promise<void> {
		await this._callFs("write", { path: this._toFsPath(path), data: data?.toString() ?? "" });
	}

	async mkdir(path: Path, mode?: number): Promise<void> {
		await this._callFs("mkdir", { path: this._toFsPath(path), mode });
	}

	async createRootPathIfNeed(): Promise<void> {
		await this._callFs("createRootPathIfNeed", { path: this._root.value });
	}

	withMountPath(): void {
		this._throwNotImplemented("withMountPath");
	}

	async getItems(): Promise<never[]> {
		this._throwNotImplemented("getItems");
	}

	getItemRef(): never {
		this._throwNotImplemented("getItemRef");
	}

	async getStat(): Promise<never> {
		this._throwNotImplemented("getStat");
	}

	async readAsBinary(): Promise<Buffer> {
		this._throwNotImplemented("readAsBinary");
	}

	async isFolder(): Promise<boolean> {
		this._throwNotImplemented("isFolder");
	}

	async readlink(): Promise<string> {
		this._throwNotImplemented("readlink");
	}

	async symlink(): Promise<void> {
		this._throwNotImplemented("symlink");
	}

	async deleteEmptyFolders(): Promise<void> {
		this._throwNotImplemented("deleteEmptyFolders");
	}

	async move(): Promise<void> {
		this._throwNotImplemented("move");
	}

	async copy(): Promise<void> {
		this._throwNotImplemented("copy");
	}

	watch(): void {
		this._throwNotImplemented("watch");
	}

	startWatch(): void {
		this._throwNotImplemented("startWatch");
	}

	stopWatch(): void {
		this._throwNotImplemented("stopWatch");
	}

	private async _callFs<T>(method: FsRequestMethod, args: Record<string, unknown>): Promise<T> {
		const requestId = this._nextRequestId();
		return new Promise<T>((resolve, reject) => {
			fsPending.set(requestId, { resolve, reject });
			this._postMessage({
				type: "fs",
				requestId,
				scope: this._scope,
				method,
				args,
			});
		});
	}

	private _nextRequestId(): string {
		return (++fsReqId).toString();
	}

	private _toFsPath(path: Path): string {
		return path.value;
	}

	private _throwNotImplemented(method: string): never {
		throw new Error(`${method} is not supported in RpcFileProvider`);
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
	const cacheFp = new RpcFileProvider(msg.cacheRoot, "cache", postMessage);
	const articleFp = new RpcFileProvider(msg.articleStorageRoot, "articleStorage", postMessage);

	const serviceAndCommit = await createSearchService({
		cacheFileProvider: cacheFp,
		articleStorageFileProvider: articleFp,
	});

	searchService = serviceAndCommit.searchService;
	commit = serviceAndCommit.commit;

	tenantId = msg.tenant;

	postMessage({
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
