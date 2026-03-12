import type { ResourceParseClient, ResourceParseFormat } from "@ext/serach/modulith/resourceParse/ResourceParseClient";
import type {
	ResourceParseWorkerInMessage,
	ResourceParseWorkerOutMessage,
} from "@ext/serach/modulith/resourceParse/worker/types";
import type { ArticleItem } from "@ics/gx-vector-search";
import type { Buffer } from "buffer";

type PendingRequest = {
	resolve: (value: ArticleItem[] | null) => void;
	reject: (reason: unknown) => void;
	progressCallback?: (progress: number) => void;
};

export interface ResourceParseWorker {
	postMessage(message: ResourceParseWorkerInMessage): void;
	terminate(): Promise<void>;
}

export abstract class WorkerResourceParseClientBase implements ResourceParseClient {
	private _requestSeq = 0;
	protected _worker!: ResourceParseWorker;
	private readonly _pending = new Map<string, PendingRequest>();

	parseResource(
		format: ResourceParseFormat,
		data: Buffer,
		progressCallback?: (progress: number) => void,
	): Promise<ArticleItem[] | null> {
		const requestId = this._nextRequestId();
		return new Promise<ArticleItem[] | null>((resolve, reject) => {
			this._pending.set(requestId, { resolve, reject, progressCallback });
			this._worker.postMessage({ type: "parseResource", requestId, format, data });
		});
	}

	async terminate(): Promise<void> {
		await this._worker.terminate();
	}

	protected async _init(): Promise<void> {
		this._worker = this._createWorker();
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
