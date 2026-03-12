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
		const client = new NodeWorkerResourceParseClient();
		await client._init();
		return client;
	}

	protected _createWorker(): ResourceParseWorker {
		const worker = new NodeWorker(new URL("./resourceParse.node.worker", import.meta.url));
		worker.on("message", (data) => this._handleMessage(data));
		return {
			postMessage: worker.postMessage.bind(worker),
			terminate: async () => {
				await worker.terminate();
			},
		};
	}
}
