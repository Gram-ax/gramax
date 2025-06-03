import { Article } from "@core/FileStructue/Article/Article";
import ChatBotSearcher, { ChatBotSearchItem, ChatBotSearchOptions } from "@ext/serach/ChatBotSearcher";
import VectorDatabaseClient from "@ext/serach/vector/VectorDatabaseClient";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";

export default class VectorChatBotSearcher implements ChatBotSearcher {
	constructor(private readonly _vectorDb: VectorDatabaseClient, private readonly _wm: WorkspaceManager) {}

	async search({
		query,
		catalogName,
		articlesLanguage,
		responseLanguage,
	}: ChatBotSearchOptions): Promise<ChatBotSearchItem[]> {
		const chatResp = await this._vectorDb.chat(query, responseLanguage, articlesLanguage, catalogName);
		const promises = chatResp.items.map(async (x) => {
			switch (x.type) {
				case "text":
					return x;
				case "link":
					const article = await this._getArticleByLogicPath(x.link);
					return !article
						? null
						: {
								type: "articleRef" as const,
								article,
						  };
				default:
					return null;
			}
		});
		return (await Promise.all(promises)).filter(Boolean);
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
