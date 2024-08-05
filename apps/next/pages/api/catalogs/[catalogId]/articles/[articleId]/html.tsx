import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { apiUtils } from "@core/Api/apiUtils";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import isAccess from "@ext/publicApi/isAccess";
import { ApplyApiMiddleware } from "apps/next/logic/Api/ApplyMiddleware";

export default ApplyApiMiddleware(
	async function (req: ApiRequest, res: ApiResponse) {
		const context = this.app.contextFactory.from(req, res);
		const catalog = await this.app.wm.current().getCatalog(req.query.catalogId as string);
		const article: Article = catalog.findItemByItemPath(new Path(req.query.articleId));

		if (!isAccess(context, article, catalog)) {
			res.statusCode = 404;
			res.end();
			return;
		}

		await parseContent(
			article,
			catalog,
			context,
			this.app.parser,
			this.app.parserContextFactory,
			true,
			apiUtils.getDomain(req),
		);
		const htmlContent = article.parsedContent.htmlValue;

		res.setHeader("Content-type", "text/html; charset=utf-8");
		res.setHeader("Access-Control-Allow-Origin", "*");

		res.send(htmlContent);
	},
	[new MainMiddleware()],
);
