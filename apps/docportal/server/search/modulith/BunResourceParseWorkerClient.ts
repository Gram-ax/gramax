import {
	type ResourceParseWorker,
	WorkerResourceParseClientBase,
} from "@ext/serach/modulith/resourceParse/worker/WorkerResourceParseClientBase";

export class BunResourceParseWorkerClient extends WorkerResourceParseClientBase {
	private constructor() {
		super();
	}

	static async create(): Promise<BunResourceParseWorkerClient> {
		return new BunResourceParseWorkerClient();
	}

	protected override createWorker(): ResourceParseWorker {
		const workerPath = new URL("./search/modulith/resourceParse.bun.worker.js", import.meta.url).href;
		const worker = new Worker(workerPath);
		worker.onmessage = (event) => this.handleMessage(event.data);
		return {
			postMessage: worker.postMessage.bind(worker),
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
