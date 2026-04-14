import {
	type SearchWorker,
	WorkerModulithSearchClientBase,
	type WorkerModulithSearchClientBaseOptions,
} from "@ext/serach/modulith/search/worker/WorkerModulithSearchClientBase";

export class BunWorkerModulithSearchClient extends WorkerModulithSearchClientBase {
	private constructor(options: WorkerModulithSearchClientBaseOptions) {
		super(options);
	}

	static async create(options: WorkerModulithSearchClientBaseOptions): Promise<BunWorkerModulithSearchClient> {
		const client = new BunWorkerModulithSearchClient(options);
		await client.init();
		return client;
	}

	protected override createWorker(): SearchWorker {
		const workerPath = new URL("./search/modulith/modulithSearch.bun.worker.js", import.meta.url).href;
		const worker = new Worker(workerPath);
		worker.onmessage = (event) => this.handleMessage(event.data);
		return {
			postMessage: worker.postMessage.bind(worker),
			terminate: async () => {
				worker.terminate();
			},
		};
	}
}
