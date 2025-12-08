import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import { ArticleLanguage, isArticleLanguage } from "@ext/serach/modulith/SearchArticle";
import { Command } from "../../types/Command";

export interface ResponseStreamItem {
	type: "text";
	text: string;
}

const chat: Command<
	{
		ctx: Context;
		query: string;
		signal: AbortSignal;
		catalogName?: string;
		articlesLanguage?: ArticleLanguage;
		responseLanguage?: ContentLanguage;
	},
	{ mime: string; iterator: AsyncGenerator<string, void, void> }
> = Command.create({
	path: "search/chat",

	kind: ResponseKind.stream,

	async do({ ctx, query, catalogName, articlesLanguage, responseLanguage, signal }) {
		const generator = await this._app.searcherManager.getChatBotSearcher().search({
			query,
			catalogName,
			articlesLanguage,
			responseLanguage,
			stream: true,
			signal: signal,
		});

		const app = this._app;

		const generateNDJsonStream = async function* (): AsyncGenerator<string, void, void> {
			for await (const x of generator) {
				let data: ResponseStreamItem | null = null;
				switch (x.type) {
					case "text": {
						data = {
							type: "text",
							text: x.text,
						};
						break;
					}
					case "articleRef": {
						data = {
							type: "text",
							text: `[${x.article.getTitle()}](<${ctx.domain}${app.conf.basePath}/${
								x.article.logicPath
							}>)`,
						};
						break;
					}
				}

				if (data) {
					yield JSON.stringify(data) + "\n";
				}
			}
		};

		return {
			mime: "application/x-ndjson",
			iterator: generateNDJsonStream(),
		};
	},

	params(ctx, q, _, signal) {
		return {
			ctx,
			signal,
			query: q.query,
			catalogName: q.catalogName,
			articlesLanguage: isArticleLanguage(q.articlesLanguage) ? q.articlesLanguage : undefined,
			responseLanguage: q.responseLanguage ? ContentLanguage[q.responseLanguage] : undefined,
		};
	},
});

export default chat;
