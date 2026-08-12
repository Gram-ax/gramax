import type {
	ResourceParseClient,
	ResourceParseFileArgs,
	ResourceParseFileResult,
	ResourceParseFormat,
} from "@ext/serach/modulith/resourceParse/ResourceParseClient";
import type {
	ResourceParseParseResourceFileInMessage,
	ResourceParseParseResourceInMessage,
	ResourceParseWorkerInMessage,
	ResourceParseWorkerOutMessage,
} from "@ext/serach/modulith/resourceParse/worker/types";
import type { SearchArticleItems } from "@ext/serach/modulith/SearchArticle";
import { type PoolWorker, WorkerPool } from "@ext/serach/modulith/utils/WorkerPool";
import type { ArticleId } from "@ics/article-search/article";
import type { Buffer } from "buffer";

const MAX_WORKERS = 3;
const WORKER_IDLE_TIMEOUT_MS = 15 * 1000;
const WORKER_TASK_TIMEOUT_MS = 60 * 1000;

type PendingRequest = {
	resolve: (value: WorkerParseResult | null) => void;
	reject: (reason: unknown) => void;
	progressCallback?: (progress: number) => void;
};

type WorkerParseResult = {
	hash?: string;
	items: SearchArticleItems | undefined;
};

type ResourceParseWorkerRequest =
	| Omit<ResourceParseParseResourceInMessage, "requestId">
	| Omit<ResourceParseParseResourceFileInMessage, "requestId">;

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
		articleId: ArticleId,
		title: string,
		format: ResourceParseFormat,
		data: Buffer,
		progressCallback?: (progress: number) => void,
	): Promise<SearchArticleItems | null> {
		const result = await this._parseResource(
			{ type: "parseResource", format, data, articleId, title },
			progressCallback,
		);
		return result?.items ?? null;
	}

	protected async _parseResourceFile(
		args: ResourceParseFileArgs,
		progressCallback?: (progress: number) => void,
	): Promise<ResourceParseFileResult | null> {
		const result = await this._parseResource({ type: "parseResourceFile", ...args }, progressCallback);
		return result?.hash ? { hash: result.hash, items: result.items } : null;
	}

	private async _parseResource(
		message: ResourceParseWorkerRequest,
		progressCallback?: (progress: number) => void,
	): Promise<WorkerParseResult | null> {
		const requestId = this._nextRequestId();
		try {
			return await this._workerPool.run((worker) => {
				return new Promise<WorkerParseResult | null>((resolve, reject) => {
					this._pending.set(requestId, { resolve, reject, progressCallback });
					worker.postMessage({ ...message, requestId });
				});
			}, WORKER_TASK_TIMEOUT_MS);
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
				if (type === "result") pending.resolve({ hash: data.hash, items: data.items });
				else pending.reject(new Error("Resource parse worker request failed", { cause: data.error }));
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
