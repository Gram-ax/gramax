import {
	type ResourceParseWorker,
	WorkerResourceParseClientBase,
} from "@ext/serach/modulith/resourceParse/worker/WorkerResourceParseClientBase";

export class WebWorkerResourceParseClient extends WorkerResourceParseClientBase {
	private constructor() {
		super();
	}

	static async create(): Promise<WebWorkerResourceParseClient> {
		return new WebWorkerResourceParseClient();
	}

	protected override createWorker(): ResourceParseWorker {
		const worker = new Worker(new URL("./resourceParse.web.worker", import.meta.url), {
			type: "module",
		});

		worker.addEventListener("message", (event) => this.handleMessage(event.data));
		return {
			postMessage: (message) => {
				worker.postMessage(message);
			},
			terminate: async () => {
				worker.terminate();
			},
			addEventListener: (type, listener) => {
				worker.addEventListener(type, listener);
			},
			removeEventListener: (type, listener) => {
				worker.removeEventListener(type, listener);
			},
		};
	}
}
