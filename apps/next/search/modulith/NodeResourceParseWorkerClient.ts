import type {
	ResourceParseFileArgs,
	ResourceParseFileResult,
} from "@ext/serach/modulith/resourceParse/ResourceParseClient";
import {
	type ResourceParseWorker,
	WorkerResourceParseClientBase,
} from "@ext/serach/modulith/resourceParse/worker/WorkerResourceParseClientBase";
import type { ProgressCallback } from "@ics/article-search-utils";
import { Worker as NodeWorker } from "worker_threads";

export class NodeWorkerResourceParseClient extends WorkerResourceParseClientBase {
	private constructor() {
		super();
	}

	static async create(): Promise<NodeWorkerResourceParseClient> {
		return new NodeWorkerResourceParseClient();
	}

	async parseResourceFile(
		args: ResourceParseFileArgs,
		progressCallback?: ProgressCallback,
	): Promise<ResourceParseFileResult | null> {
		return await this._parseResourceFile(args, progressCallback);
	}

	protected override _createWorker(): ResourceParseWorker {
		const worker = new NodeWorker(new URL("./resourceParse.node.worker", import.meta.url));
		worker.on("message", (data) => this._handleMessage(data));
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
