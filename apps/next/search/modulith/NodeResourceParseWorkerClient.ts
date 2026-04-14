import {
	type ResourceParseWorker,
	WorkerResourceParseClientBase,
} from "@ext/serach/modulith/resourceParse/worker/WorkerResourceParseClientBase";
import { Worker as NodeWorker } from "worker_threads";

export class NodeWorkerResourceParseClient extends WorkerResourceParseClientBase {
	private constructor() {
		super();
	}

	static async create(): Promise<NodeWorkerResourceParseClient> {
		return new NodeWorkerResourceParseClient();
	}

	protected override createWorker(): ResourceParseWorker {
		const worker = new NodeWorker(new URL("./resourceParse.node.worker", import.meta.url));
		worker.on("message", (data) => this.handleMessage(data));
		return {
			postMessage: worker.postMessage.bind(worker),
			terminate: async () => {
				await worker.terminate();
			},
			addEventListener: (type, listener) => {
				worker.on(type, listener);
			},
			removeEventListener: (type, listener) => {
				worker.off(type, listener);
			},
		};
	}
}
