import type { ResourceParseClient, ResourceParseFormat } from "@ext/serach/modulith/resourceParse/ResourceParseClient";
import type {
	ResourceParseWorkerInMessage,
	ResourceParseWorkerOutMessage,
} from "@ext/serach/modulith/resourceParse/worker/types";
import { type PoolWorker, WorkerPool } from "@ext/serach/modulith/utils/WorkerPool";
import type { ArticleItem } from "@ics/modulith-search-domain/article";
import type { Buffer } from "buffer";

const MAX_WORKERS = 3;
const WORKER_IDLE_TIMEOUT_MS = 15 * 1000;

type PendingRequest = {
	resolve: (value: ArticleItem[] | null) => void;
	reject: (reason: unknown) => void;
	progressCallback?: (progress: number) => void;
};

export interface ResourceParseWorker extends PoolWorker {
	postMessage(message: ResourceParseWorkerInMessage): void;
}

export abstract class WorkerResourceParseClientBase implements ResourceParseClient {
	private _requestSeq = 0;
	private readonly _pending = new Map<string, PendingRequest>();
	private readonly _workerPool = new WorkerPool<ResourceParseWorker>(MAX_WORKERS, WORKER_IDLE_TIMEOUT_MS, () =>
		this.createWorker(),
	);

	async parseResource(
		format: ResourceParseFormat,
		data: Buffer,
		progressCallback?: (progress: number) => void,
	): Promise<ArticleItem[] | null> {
		const requestId = this._nextRequestId();
		try {
			return await this._workerPool.run((worker) => {
				return new Promise<ArticleItem[] | null>((resolve, reject) => {
					this._pending.set(requestId, { resolve, reject, progressCallback });
					worker.postMessage({ type: "parseResource", requestId, format, data });
				});
			});
		} catch (e) {
			this._pending.delete(requestId);
			throw e;
		}
	}

	async terminate(): Promise<void> {
		await this._workerPool.terminate();
	}

	protected abstract createWorker(): ResourceParseWorker;

	protected async handleMessage(data: ResourceParseWorkerOutMessage) {
		const type = data.type;
		switch (type) {
			case "progress":
			case "result":
			case "error": {
				const pending = this._pending.get(data.requestId);
				if (!pending) return;
				if (type === "progress") return pending.progressCallback?.(data.progress);

				this._pending.delete(data.requestId);
				if (type === "result") pending.resolve(data.items);
				else pending.reject(new Error("Worker request failed", { cause: data.error }));
				return;
			}
			default:
				console.error(`Unexpected message type: ${type}`, data);
		}
	}

	private _nextRequestId(): string {
		return `${++this._requestSeq}`;
	}
}
