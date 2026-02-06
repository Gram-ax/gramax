import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import CustomArticle from "@core/SitePresenter/customArticles/model/CustomArticle";

const getCustomArticle: Command<{ name: CustomArticle; props: any }, { title: string; content: string }> =
	Command.create({
		path: "article/features/getCustomArticle",

		kind: ResponseKind.json,

		middlewares: [],

		async do({ name, props }) {
			const { customArticlePresenter, parser } = this._app;

			const article = customArticlePresenter.getArticle(name, props);
			if (article && (await article.parsedContent.isNull())) {
				await article.parsedContent.write(() => parser.parse(article.content));
			}

			return {
				title: article?.getTitle() ?? "None article",
				content: await article.parsedContent.read((content) =>
					content ? JSON.stringify(content.renderTree) : "",
				),
			};
		},

		params(ctx, q, body) {
			const name = q.name as CustomArticle;
			return { ctx, name, props: body };
		},
	});

export default getCustomArticle;
