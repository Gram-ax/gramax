import { Level, span, traced } from "@ext/loggers/opentelemetry";
import {
	type SearchWorker,
	WorkerModulithSearchClientBase,
	type WorkerModulithSearchClientBaseOptions,
} from "@ext/serach/modulith/search/worker/WorkerModulithSearchClientBase";
import { Worker as NodeWorker } from "worker_threads";

export class NodeWorkerModulithSearchClient extends WorkerModulithSearchClientBase {
	private constructor(options: WorkerModulithSearchClientBaseOptions) {
		super(options);
	}

	static async create(options: WorkerModulithSearchClientBaseOptions): Promise<NodeWorkerModulithSearchClient> {
		const client = new NodeWorkerModulithSearchClient(options);
		await client._init();
		return client;
	}

	protected override _createWorker(): SearchWorker {
		const worker = new NodeWorker(new URL("./modulithSearch.node.worker", import.meta.url));
		worker.on("message", (data) => this._handleMessage(data));
		worker.on("error", (err: unknown) => {
			span()?.recordException(err instanceof Error ? err : new Error(String(err)));
			this._failAllPending(new Error(`Search worker crashed: ${String(err)}`));
		});
		worker.on("messageerror", (err: unknown) =>
			traced("search-worker.messageerror", { level: Level.Commands }, () => {
				span()?.recordException(err instanceof Error ? err : new Error(String(err)));
			}),
		);
		worker.on("exit", (code) => {
			if (code !== 0) {
				this._failAllPending(new Error(`Search worker exited with code ${code}`));
			}
		});
		return {
			postMessage: worker.postMessage.bind(worker),
			terminate: async () => {
				await worker.terminate();
			},
		};
	}
}
