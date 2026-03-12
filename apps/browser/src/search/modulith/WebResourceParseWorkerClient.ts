import {
	type ResourceParseWorker,
	WorkerResourceParseClientBase,
} from "@ext/serach/modulith/resourceParse/worker/WorkerResourceParseClientBase";

export class WebWorkerResourceParseClient extends WorkerResourceParseClientBase {
	private constructor() {
		super();
	}

	static async create(): Promise<WebWorkerResourceParseClient> {
		const client = new WebWorkerResourceParseClient();
		await client._init();
		return client;
	}

	protected _createWorker(): ResourceParseWorker {
		const worker = new Worker(new URL("./resourceParse.web.worker", import.meta.url), {
			type: "module",
		});

		worker.addEventListener("message", (event) => this._handleMessage(event.data));
		return {
			postMessage: worker.postMessage.bind(worker),
			terminate: async () => {
				worker.terminate();
			},
		};
	}
}
