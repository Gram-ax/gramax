import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { apiUtils } from "@core/Api/apiUtils";
import { AllowedOriginsMiddleware } from "@core/Api/middleware/AllowedOriginsMiddleware";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import parseContent from "@core/FileStructue/Article/parseContent";
import ExceptionsResponse from "@ext/publicApi/ExceptionsResponse";
import { ApplyApiMiddleware } from "apps/next/logic/Api/ApplyMiddleware";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";

export default ApplyApiMiddleware(
	async function (req: ApiRequest, res: ApiResponse) {
		const { contextFactory, parser, sitePresenterFactory, parserContextFactory } = this.app;
		const context = await contextFactory.from(req, res);
		const catalogName = req.query.catalogId as string;
		const articleId = req.query.articleId as string;
		const dataProvider = sitePresenterFactory.fromContext(context);
		const { article, catalog } = await dataProvider.getArticleByPathOfCatalog([catalogName, articleId], []);

		if (new ExceptionsResponse(res, context).checkArticleAvailability(catalog, catalogName, article, articleId))
			return;

		const originDomain = (req.query.originDomain as string) ?? apiUtils.getDomain(req);

		await parseContent(article, catalog, context, parser, parserContextFactory, true, originDomain);
		const parserContext = parserContextFactory.fromArticle(
			article,
			catalog,
			convertContentToUiLanguage(context.contentLanguage || catalog?.props?.language),
			context.user?.isLogged,
		);
		const htmlContent = parser.getHtml(
			(await article.parsedContent.read()).renderTree,
			parserContext,
			originDomain,
		);

		res.setHeader("Content-type", "text/html; charset=utf-8");
		res.setHeader("Access-Control-Allow-Origin", "*");

		res.send(htmlContent);
	},
	[new MainMiddleware(), new AllowedOriginsMiddleware()],
);
