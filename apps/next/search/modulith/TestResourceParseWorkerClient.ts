import type { ResourceParseFormat } from "@ext/serach/modulith/resourceParse/ResourceParseClient";
import type { HandlerContext } from "@ext/serach/modulith/resourceParse/worker/resourceParse.base.worker";
import type { ResourceParseWorkerInMessage } from "@ext/serach/modulith/resourceParse/worker/types";
import {
	type ResourceParseWorker,
	WorkerResourceParseClientBase,
} from "@ext/serach/modulith/resourceParse/worker/WorkerResourceParseClientBase";
import type { ArticleItem } from "@ics/gx-vector-search";

export class TestWorkerResourceParseClient extends WorkerResourceParseClientBase {
	private _handleInMessage: (msg: ResourceParseWorkerInMessage) => void;

	private constructor() {
		super();
	}

	static async create(): Promise<TestWorkerResourceParseClient> {
		const client = new TestWorkerResourceParseClient();
		await client._init();
		return client;
	}

	async parseResource(
		format: ResourceParseFormat,
		data: Buffer,
		progressCallback?: (progress: number) => void,
	): Promise<ArticleItem[] | null> {
		await this._initHandler();
		return await super.parseResource(format, data, progressCallback);
	}

	protected async _init(): Promise<void> {
		this._worker = this._createWorker();
	}

	protected _createWorker(): ResourceParseWorker {
		return {
			postMessage: (msg) => {
				void this._handleInMessage(msg);
			},
			terminate: async () => {},
		};
	}

	private async _initHandler(): Promise<void> {
		const ctx: HandlerContext = {
			isNode: true,
			initPdfJs: async () => {},
			postMessage: (msg) => {
				void this._handleMessage(msg);
			},
		};

		const handleMessage = (await import("@ext/serach/modulith/resourceParse/worker/resourceParse.base.worker"))
			.handleMessage;

		this._handleInMessage = (msg) => {
			handleMessage(msg, ctx);
		};

		await super._init();
	}
}
