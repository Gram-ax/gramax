import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import { Command, ResponseKind } from "../../../types/Command";

const getCustomArticle: Command<{ name: string }, { title: string; content: string }> = Command.create({
	path: "article/features/getCustomArticle",

	kind: ResponseKind.json,

	middlewares: [],

	async do({ name }) {
		const { parser } = this._app;

		const customArticlePresenter = new CustomArticlePresenter();
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
