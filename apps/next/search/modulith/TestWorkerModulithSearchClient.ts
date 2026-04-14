import type { SearchArticleMetadata } from "@ext/serach/modulith/SearchArticle";
import type {
	GetArticlePayloadsArgs,
	GetArticlePayloadsResult,
	SearchBatchArgs,
	SearchResult,
	UpdateArgs,
} from "@ext/serach/modulith/search/ModulithSearchClient";
import type { SearchWorkerInMessage } from "@ext/serach/modulith/search/worker/types";
import {
	type SearchWorker,
	WorkerModulithSearchClientBase,
	type WorkerModulithSearchClientBaseOptions,
} from "@ext/serach/modulith/search/worker/WorkerModulithSearchClientBase";

export class TestWorkerModulithSearchClient extends WorkerModulithSearchClientBase {
	private _initPromise: Promise<void> | undefined;
	private _handleInMessage: (msg: SearchWorkerInMessage) => void;

	private constructor(options: WorkerModulithSearchClientBaseOptions) {
		super(options);
	}

	static async create(options: WorkerModulithSearchClientBaseOptions): Promise<TestWorkerModulithSearchClient> {
		const client = new TestWorkerModulithSearchClient(options);
		await client.init();
		return client;
	}

	override async update({ articles, filter, progressCallback }: UpdateArgs): Promise<void> {
		await this._initHandler();
		return await super.update({ articles, filter, progressCallback });
	}

	override async searchBatch({ items }: SearchBatchArgs): Promise<SearchResult[][]> {
		await this._initHandler();
		return await super.searchBatch({ items });
	}

	override async getArticlePayloads<TMetadata extends SearchArticleMetadata = SearchArticleMetadata>(
		args: GetArticlePayloadsArgs,
	): Promise<GetArticlePayloadsResult<TMetadata>> {
		await this._initHandler();
		return await super.getArticlePayloads(args);
	}

	protected override async init(): Promise<void> {
		this.worker = this.createWorker();
	}

	protected override createWorker(): SearchWorker {
		return {
			postMessage: (msg) => {
				void this._handleInMessage(msg);
			},
			terminate: async () => {},
		};
	}

	private _initHandler(): Promise<void> {
		if (this._initPromise == null) {
			this._initPromise = this._initHandlerImpl();
		}

		return this._initPromise;
	}

	private async _initHandlerImpl(): Promise<void> {
		const handleMessage = (await import("@ext/serach/modulith/search/worker/modulithSearch.base.worker"))
			.handleMessage;

		this._handleInMessage = (msg) => {
			handleMessage(msg, (data) => {
				void this.handleMessage(data);
			});
		};

		await super.init();
	}
}
