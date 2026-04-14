import ExceptionsResponse from "@ext/publicApi/ExceptionsResponse";
import type ServerContext from "../../types/ServerContext";
import articleHtml from "./articleHtml";
import articleResource from "./articleResource";
import catalogNavigation from "./catalogNavigation";
import catalogs from "./catalogs";
import { ARTICLE_HTML, ARTICLE_RESOURCE, CATALOG_NAVIGATION, CATALOGS, USER_TOKEN } from "./routes";
import userToken from "./userToken";

const publicApi = async (serverContext: ServerContext) => {
	const { req, res, path, app, commands } = serverContext;
	const { parserContextFactory, parser, sitePresenterFactory, wm, contextFactory, ticketManager } = app;

	const ctx = await contextFactory.fromNode({ req, res });
	const workspace = wm.current();
	const sitePresenter = sitePresenterFactory.fromContext(ctx);
	const exceptionsResponse = new ExceptionsResponse(res, ctx);

	if (USER_TOKEN.test(path.pathname)) {
		return userToken(ctx, req, ticketManager);
	}
	if (CATALOGS.test(path.pathname)) {
		return catalogs(req, sitePresenter, workspace);
	}
	const navigationMatch = path.pathname.match(CATALOG_NAVIGATION);
	if (navigationMatch) {
		const [, catalogName] = navigationMatch;
		return catalogNavigation(req, res, sitePresenter, exceptionsResponse, catalogName);
	}
	const articleHtmlMatch = path.pathname.match(ARTICLE_HTML);
	if (articleHtmlMatch) {
		const [, catalogName, articleId] = articleHtmlMatch;
		return articleHtml(
			ctx,
			req,
			res,
			sitePresenter,
			exceptionsResponse,
			parser,
			parserContextFactory,
			catalogName,
			decodeURIComponent(articleId),
		);
	}
	const articleResourceMatch = path.pathname.match(ARTICLE_RESOURCE);
	if (articleResourceMatch) {
		const [, catalogName, articleId, resourcePath] = articleResourceMatch;
		return articleResource(
			ctx,
			req,
			res,
			sitePresenter,
			exceptionsResponse,
			commands,
			catalogName,
			decodeURIComponent(articleId),
			decodeURIComponent(resourcePath),
		);
	}
};

export default publicApi;
