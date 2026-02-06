import type { Article } from "@core/FileStructue/Article/Article";
import type ChatBotSearcher from "@ext/serach/ChatBotSearcher";
import type { ChatBotSearchItem, ChatBotSearchStream, SearchArgs, SearchStreamArgs } from "@ext/serach/ChatBotSearcher";
import type { RemoteModulithSearchClient } from "@ext/serach/modulith/RemoteModulithSearchClient";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";
import type { ChatResponse, ChatResponseItem, ChatStreamResponse } from "@ics/gx-vector-search";

export default class ModulithChatBotSearcher implements ChatBotSearcher {
	constructor(
		private readonly _searcher: RemoteModulithSearchClient,
		private readonly _wm: WorkspaceManager,
	) {}

	async search(args: SearchArgs): Promise<ChatBotSearchItem[]>;
	async search(args: SearchStreamArgs): Promise<ChatBotSearchStream>;
	async search(args: SearchArgs | SearchStreamArgs): Promise<ChatBotSearchItem[] | ChatBotSearchStream> {
		const chatResp = await this._searcher.chat(args);
		if (args.stream) {
			return this._generateStream((chatResp as ChatStreamResponse).generator);
		}

		const promises = (chatResp as ChatResponse).items.map(this._convertItem);
		return (await Promise.all(promises)).filter(Boolean);
	}

	private async *_generateStream(generator: AsyncGenerator<ChatResponseItem, void, void>): ChatBotSearchStream {
		for await (const el of generator) {
			const item = await this._convertItem(el);
			if (item) yield item;
		}
	}

	private async _convertItem(x: ChatResponseItem): Promise<ChatBotSearchItem> {
		switch (x.type) {
			case "text":
				return x;
			case "link": {
				const article = await this._getArticleByLogicPath(x.link);
				return !article
					? null
					: {
							type: "articleRef" as const,
							article,
						};
			}
			default:
				return null;
		}
	}

	private async _getArticleByLogicPath(logicPath: string): Promise<Article | null> {
		const catalogName = this._getCatalogName(logicPath);
		const catalog = await this._wm.current().getContextlessCatalog(catalogName);
		const article = catalog?.findArticle(logicPath, []);
		return article;
	}

	private _getCatalogName(logicPath: string) {
		return logicPath.split("/")[0];
	}
}
