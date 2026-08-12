import type {
	ResourceParseFileArgs,
	ResourceParseFileResult,
} from "@ext/serach/modulith/resourceParse/ResourceParseClient";
import {
	type ResourceParseWorker,
	WorkerResourceParseClientBase,
} from "@ext/serach/modulith/resourceParse/worker/WorkerResourceParseClientBase";
import type { ProgressCallback } from "@ics/article-search-utils";

export class BunResourceParseWorkerClient extends WorkerResourceParseClientBase {
	private constructor() {
		super();
	}

	static async create(): Promise<BunResourceParseWorkerClient> {
		return new BunResourceParseWorkerClient();
	}

	async parseResourceFile(
		args: ResourceParseFileArgs,
		progressCallback?: ProgressCallback,
	): Promise<ResourceParseFileResult | null> {
		return await this._parseResourceFile(args, progressCallback);
	}

	protected override _createWorker(): ResourceParseWorker {
		const workerPath = new URL("./search/modulith/resourceParse.bun.worker.js", import.meta.url).href;
		const worker = new Worker(workerPath);
		worker.onmessage = (event) => this._handleMessage(event.data);
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
