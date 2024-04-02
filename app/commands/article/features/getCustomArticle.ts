import { ResponseKind } from "@app/types/ResponseKind";
import { Command } from "../../../types/Command";

const getCustomArticle: Command<{ name: string }, { title: string; content: string }> = Command.create({
	path: "article/features/getCustomArticle",

	kind: ResponseKind.json,

	middlewares: [],

	async do({ name }) {
		const { customArticlePresenter, parser } = this._app;

		const article = customArticlePresenter.getArticle(name);
		if (article && !article.parsedContent) article.parsedContent = await parser.parse(article.content);

		return {
			title: article?.getTitle() ?? "None article",
			content: JSON.stringify(article?.parsedContent?.renderTree ?? {}),
		};
	},

	params(ctx, q) {
		const name = q.name;
		return { ctx, name };
	},
});

export default getCustomArticle;
