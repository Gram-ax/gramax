import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { TENANT_NAME } from "@ext/serach/modulith/consts";
import type { SearchArticleMetadata } from "@ext/serach/modulith/SearchArticle";
import type {
	GetArticlePayloadsArgs,
	GetArticlePayloadsResult,
	ModulithSearchClient,
	SearchBatchArgs,
	SearchResult,
	UpdateArgs,
} from "@ext/serach/modulith/search/ModulithSearchClient";
import type {
	SearchWorkerFsInMessage,
	SearchWorkerFsOutMessage,
	SearchWorkerInMessage,
	SearchWorkerOutMessage,
} from "@ext/serach/modulith/search/worker/types";
import { createSimpleError } from "@ext/serach/modulith/utils/SimpleError";

type PendingRequest<T> = {
	resolve: (value: T) => void;
	reject: (reason: unknown) => void;
	progressCallback?: (value: number) => void;
};

export interface SearchWorker {
	postMessage(message: SearchWorkerInMessage): void;
	terminate(): Promise<void>;
}

export interface WorkerModulithSearchClientBaseOptions {
	cacheFileProvider: FileProvider;
	articleStorageFileProvider: FileProvider;
}

export abstract class WorkerModulithSearchClientBase implements ModulithSearchClient {
	private _requestSeq = 0;
	protected worker!: SearchWorker;
	private readonly _pending = new Map<string, PendingRequest<unknown>>();

	constructor(private readonly _options: WorkerModulithSearchClientBaseOptions) {}

	async update({ articles, filter, progressCallback }: UpdateArgs): Promise<void> {
		const requestId = this._nextRequestId();

		return new Promise<void>((resolve, reject) => {
			this._pending.set(requestId, { resolve, reject, progressCallback });
			this.worker.postMessage({
				type: "update",
				requestId,
				args: { articles, filter },
			});
		});
	}

	async searchBatch({ items }: SearchBatchArgs): Promise<SearchResult[][]> {
		const requestId = this._nextRequestId();

		return new Promise<SearchResult[][]>((resolve, reject) => {
			this._pending.set(requestId, { resolve, reject });
			this.worker.postMessage({
				type: "searchBatch",
				requestId,
				args: { items },
			});
		});
	}

	async getArticlePayloads<TMetadata extends SearchArticleMetadata = SearchArticleMetadata>(
		args: GetArticlePayloadsArgs,
	): Promise<GetArticlePayloadsResult<TMetadata>> {
		const requestId = this._nextRequestId();
		return new Promise<GetArticlePayloadsResult<TMetadata>>((resolve, reject) => {
			this._pending.set(requestId, { resolve, reject });
			this.worker.postMessage({
				type: "getArticlePayloads",
				requestId,
				args,
			});
		});
	}

	async commit(): Promise<void> {
		const requestId = this._nextRequestId();
		return new Promise<void>((resolve, reject) => {
			this._pending.set(requestId, { resolve, reject });
			this.worker.postMessage({
				type: "commit",
				requestId,
			});
		});
	}

	async terminate(): Promise<void> {
		await this.worker.terminate();
	}

	protected async init(): Promise<void> {
		this.worker = this.createWorker();

		const cacheRoot = this._options.cacheFileProvider.rootPath.value;
		const articleStorageRoot = this._options.articleStorageFileProvider.rootPath.value;

		const requestId = this._nextRequestId();
		await new Promise<void>((resolve, reject) => {
			this._pending.set(requestId, { resolve, reject });
			this.worker.postMessage({
				type: "init",
				requestId,
				tenant: TENANT_NAME,
				cacheRoot,
				articleStorageRoot,
			});
		});
	}

	protected abstract createWorker(): SearchWorker;

	protected async handleMessage(data: SearchWorkerOutMessage) {
		const type = data.type;
		switch (type) {
			case "fs":
				return await this._handleFsRequest(data);
			case "progress":
			case "ok":
			case "searchResult":
			case "getArticlePayloads":
			case "error": {
				const pending = this._pending.get(data.requestId);
				if (!pending) return;
				if (type === "progress") return pending.progressCallback?.(data.progress);

				this._pending.delete(data.requestId);
				if (type === "ok") pending.resolve(undefined);
				else if (type === "error") pending.reject(new Error("Worker request failed", { cause: data.error }));
				else if (type === "searchResult") pending.resolve(data.result);
				else if (type === "getArticlePayloads") pending.resolve(data.result);
				return;
			}
			default:
				console.error(`Unexpected message type: ${type}`, data);
		}
	}

	private async _handleFsRequest(data: SearchWorkerFsOutMessage): Promise<void> {
		const provider =
			data.scope === "cache" ? this._options.cacheFileProvider : this._options.articleStorageFileProvider;

		let result: unknown;

		try {
			switch (data.method) {
				case "exists":
					result = await provider.exists(new Path(data.args.path as string));
					break;
				case "write":
					result = await provider.write(
						new Path(data.args.path as string),
						data.args.data as string | Buffer,
					);
					break;
				case "read":
					result = await provider.read(new Path(data.args.path as string));
					break;
				case "readAsArrayBuffer": {
					const buffer = await provider.readAsBinary(new Path(data.args.path as string));
					result = buffer?.buffer;
					break;
				}
				case "delete":
					result = await provider.delete(new Path(data.args.path as string));
					break;
				case "mkdir":
					result = await provider.mkdir(new Path(data.args.path as string), data.args.mode as number);
					break;
				case "readdir":
					result = await provider.readdir(new Path(data.args.path as string));
					break;
				case "isRootPathExists":
					result = await provider.isRootPathExists();
					break;
				case "createRootPathIfNeed":
					result = await provider.createRootPathIfNeed();
					break;
				default:
					console.error(`Unexpected FS method: ${data.method}`, data);
			}

			const response: SearchWorkerFsInMessage = {
				type: "fs",
				requestId: data.requestId,
				ok: true,
				result,
			};

			this.worker.postMessage(response);
		} catch (e) {
			const err = e instanceof Error ? e : new Error(String(e));
			const response: SearchWorkerFsInMessage = {
				type: "fs",
				requestId: data.requestId,
				ok: false,
				error: createSimpleError(err),
			};
			this.worker.postMessage(response);
		}
	}

	private _nextRequestId(): string {
		return `${++this._requestSeq}`;
	}
}
