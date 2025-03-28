import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { apiUtils } from "@core/Api/apiUtils";
import { AllowedOriginsMiddleware } from "@core/Api/middleware/AllowedOriginsMiddleware";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import parseContent from "@core/FileStructue/Article/parseContent";
import ExceptionsResponse from "@ext/publicApi/ExceptionsResponse";
import { ApplyApiMiddleware } from "apps/next/logic/Api/ApplyMiddleware";

export default ApplyApiMiddleware(
	async function (req: ApiRequest, res: ApiResponse) {
		const context = await this.app.contextFactory.from(req, res);
		const catalogName = req.query.catalogId as string;
		const articleId = req.query.articleId as string;
		const dataProvider = this.app.sitePresenterFactory.fromContext(context);
		const { article, catalog } = await dataProvider.getArticleByPathOfCatalog([catalogName, articleId], []);

		if (new ExceptionsResponse(res, context).checkArticleAvailability(catalog, catalogName, article, articleId))
			return;

		await parseContent(
			article,
			catalog,
			context,
			this.app.parser,
			this.app.parserContextFactory,
			true,
			apiUtils.getDomain(req),
		);
		const htmlContent = await article.parsedContent.read((p) => p.htmlValue);

		res.setHeader("Content-type", "text/html; charset=utf-8");
		res.setHeader("Access-Control-Allow-Origin", "*");

		res.send(htmlContent);
	},
	[new MainMiddleware(), new AllowedOriginsMiddleware()],
);
