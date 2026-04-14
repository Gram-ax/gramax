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
		await client.init();
		return client;
	}

	protected override createWorker(): SearchWorker {
		const worker = new NodeWorker(new URL("./modulithSearch.node.worker", import.meta.url));
		worker.on("message", (data) => this.handleMessage(data));
		return {
			postMessage: worker.postMessage.bind(worker),
			terminate: async () => {
				await worker.terminate();
			},
		};
	}
}
