import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import { defaultLanguage } from "@ext/localization/core/model/Language";
import { Token } from "@ext/markdown/core/render/logic/Markdoc";
import { Command, ResponseKind } from "../../types/Command";

const countComments = (token: Token): number => {
	let count = 0;
	if (token.type === "tag_open" && token?.meta?.tag === "comment") count++;
	if (token.children) token.children.forEach((t: Token) => (count += countComments(t)));
	return count;
};

const getNavigationUnresolvedCommentsCount: Command<{ catalogName: string }, { [articlePath: string]: number }> =
	Command.create({
		path: "comments/getNavigationUnresolvedCommentsCount",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

		async do({ catalogName }) {
			const { lib, parser, parserContextFactory } = this._app;

			if (!catalogName) return;
			const commentsCount: { [articlePath: string]: number } = {};
			const catalog = await lib.getCatalog(catalogName);
			const articles = catalog.getContentItems();

			for (const article of articles) {
				const context = parserContextFactory.fromArticle(article, catalog, defaultLanguage, true);
				const tokens = await parser.getTokens(article.content, context);

				const count = tokens.reduce((p, x) => p + countComments(x), 0);
				commentsCount[article.logicPath] = count;
			}

			return commentsCount;
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			return { ctx, catalogName };
		},
	});

export default getNavigationUnresolvedCommentsCount;
