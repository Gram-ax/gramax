import {
	type SearchWorker,
	WorkerModulithSearchClientBase,
	type WorkerModulithSearchClientBaseOptions,
} from "@ext/serach/modulith/search/worker/WorkerModulithSearchClientBase";

export class WebWorkerModulithSearchClient extends WorkerModulithSearchClientBase {
	private constructor(options: WorkerModulithSearchClientBaseOptions) {
		super(options);
	}

	static async create(options: WorkerModulithSearchClientBaseOptions): Promise<WebWorkerModulithSearchClient> {
		const client = new WebWorkerModulithSearchClient(options);
		await client.init();
		return client;
	}

	protected override createWorker(): SearchWorker {
		const worker = new Worker(new URL("./modulithSearch.web.worker", import.meta.url), {
			type: "module",
		});

		worker.addEventListener("message", (event) => this.handleMessage(event.data));
		return {
			postMessage: worker.postMessage.bind(worker),
			terminate: async () => {
				worker.terminate();
			},
		};
	}
}
