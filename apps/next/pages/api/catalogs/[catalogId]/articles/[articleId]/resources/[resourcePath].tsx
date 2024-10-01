import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { apiUtils } from "@core/Api/apiUtils";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import Path from "@core/FileProvider/Path/Path";
import ExceptionsResponse from "@ext/publicApi/ExceptionsResponse";
import { ApplyApiMiddleware } from "apps/next/logic/Api/ApplyMiddleware";

export default ApplyApiMiddleware(
	async function (req: ApiRequest, res: ApiResponse) {
		const context = this.app.contextFactory.from(req, res);
		const dataProvider = this.app.sitePresenterFactory.fromContext(context);
		const catalogName = req.query.catalogId as string;
		const articleId = req.query.articleId as string;
		const { article, catalog } = await dataProvider.getArticleByPathOfCatalog([catalogName, articleId], []);
		const exceptionsResponse = new ExceptionsResponse(res, context);

		if (exceptionsResponse.checkArticleAvailability(catalog, catalogName, article, articleId)) return;

		const src = req.query.resourcePath as string;

		const { mime, hashItem } = await this.commands.article.resource.get.do({
			src: new Path(src),
			ctx: context,
			articlePath: article.ref.path,
			catalogName: catalogName,
			ifNotExistsErrorText: null,
			mimeType: null,
		});

		if (!(await hashItem.getContent())) {
			exceptionsResponse.getResourceException(catalogName, articleId, src);
			return;
		}

		if (mime) res.setHeader("Content-Type", mime);
		if (mime == MimeTypes.xml || mime == MimeTypes.xls || MimeTypes.xlsx)
			res.setHeader("Content-Disposition", `attachment; filename=${encodeURIComponent(src)}`);

		if (hashItem) await apiUtils.sendWithETag(req, res, hashItem, this.app.hashes);
	},
	[new MainMiddleware()],
);
