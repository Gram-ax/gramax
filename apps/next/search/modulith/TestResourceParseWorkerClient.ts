import type { ResourceParseFormat } from "@ext/serach/modulith/resourceParse/ResourceParseClient";
import type { HandlerContext } from "@ext/serach/modulith/resourceParse/worker/resourceParse.base.worker";
import type { ResourceParseWorkerInMessage } from "@ext/serach/modulith/resourceParse/worker/types";
import {
	type ResourceParseWorker,
	WorkerResourceParseClientBase,
} from "@ext/serach/modulith/resourceParse/worker/WorkerResourceParseClientBase";
import type { SearchArticleItems } from "@ext/serach/modulith/SearchArticle";
import type { ArticleId } from "@ics/article-search/article";

export class TestWorkerResourceParseClient extends WorkerResourceParseClientBase {
	private _handleInMessage: (msg: ResourceParseWorkerInMessage) => void;

	private constructor() {
		super();
	}

	static async create(): Promise<TestWorkerResourceParseClient> {
		return new TestWorkerResourceParseClient();
	}

	override async parseResource(
		articleId: ArticleId,
		title: string,
		format: ResourceParseFormat,
		data: Buffer,
		progressCallback?: (progress: number) => void,
	): Promise<SearchArticleItems | null> {
		await this._initHandler();
		return await super.parseResource(articleId, title, format, data, progressCallback);
	}

	protected override _createWorker(): ResourceParseWorker {
		return {
			postMessage: (msg) => {
				void this._handleInMessage(msg);
			},
			terminate: async () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
		};
	}

	private async _initHandler(): Promise<void> {
		const ctx: HandlerContext = {
			isNode: true,
			postMessage: (msg) => {
				void this._handleMessage(msg);
			},
		};

		const handleMessage = (await import("@ext/serach/modulith/resourceParse/worker/resourceParse.base.worker"))
			.handleMessage;

		this._handleInMessage = (msg) => {
			handleMessage(msg, ctx);
		};
	}
}
