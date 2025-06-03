import { Command } from "../../types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import Context from "@core/Context/Context";
import { ArticleLanguage } from "@ext/serach/vector/VectorArticle";

const chat: Command<
	{
		ctx: Context;
		query: string;
		catalogName?: string;
		articlesLanguage?: ArticleLanguage;
		responseLanguage?: ContentLanguage;
	},
	RenderableTreeNodes | undefined
> = Command.create({
	path: "search/chat",

	kind: ResponseKind.json,

	async do({ ctx, query, catalogName, articlesLanguage, responseLanguage }) {
		const items = await this._app.searcherManager.getChatBotSearcher().search({
			query,
			catalogName,
			articlesLanguage,
			responseLanguage
		});
		
		const md = items.map(x => {
			switch (x.type) {
				case "text":
					return x.text;
				case "articleRef":
					return `[${x.article.getTitle()}](${ctx.domain}${this._app.conf.basePath}/${x.article.logicPath})`;
			}
		}).join("");

		return await this._app.parser.parseRenderableTreeNode(md);
	},

	params(ctx, q) {
		return {
			ctx,
			query: q.query,
			catalogName: q.catalogName,
			articlesLanguage: q.articlesLanguage
				? q.articlesLanguage === "none"
					? "none"
					: ContentLanguage[q.articlesLanguage]
				: undefined,
			responseLanguage: q.responseLanguage ? ContentLanguage[q.responseLanguage] : undefined,
		};
	},
});

export default chat;
