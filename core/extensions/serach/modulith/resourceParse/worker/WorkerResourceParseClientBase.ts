import type { ResourceParseClient, ResourceParseFormat } from "@ext/serach/modulith/resourceParse/ResourceParseClient";
import type {
	ResourceParseWorkerInMessage,
	ResourceParseWorkerOutMessage,
} from "@ext/serach/modulith/resourceParse/worker/types";
import { toWorkerError } from "@ext/serach/modulith/utils/toWorkerError";
import { type PoolWorker, WorkerPool } from "@ext/serach/modulith/utils/WorkerPool";
import type { ArticleItem } from "@ics/article-search/article";
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
		this._createWorker(),
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

	protected abstract _createWorker(): ResourceParseWorker;

	protected async _handleMessage(data: ResourceParseWorkerOutMessage) {
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
				else pending.reject(toWorkerError(data.error));
				return;
			}
			default:
				if (isPdfJsServiceMessage(data)) {
					// Ignore pdf.js fake-worker service messages
					// With PDF.js worker disabled, its internal messages leak into our worker channel
					break;
				}
				console.error(`Unexpected message type: ${type}`, data);
				break;
		}
	}

	private _nextRequestId(): string {
		return `${++this._requestSeq}`;
	}
}

function isPdfJsServiceMessage(data: object): boolean {
	return (
		data != null &&
		"sourceName" in data &&
		"targetName" in data &&
		"action" in data &&
		data.sourceName === "worker" &&
		data.targetName === "main"
	);
}
