import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { apiUtils } from "@core/Api/apiUtils";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
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
		const src = req.query.resourcePath as string;

		const { mime, hashItem } = await this.commands.article.resource.get.do({
			src: new Path(src),
			ctx: context,
			articlePath: new Path(req.query.articleId),
			catalogName: req.query.catalogId as string,
			ifNotExistsErrorText: null,
			mimeType: null,
		});

		if (mime) res.setHeader("Content-Type", mime);
		if (mime == MimeTypes.xml || mime == MimeTypes.xls || MimeTypes.xlsx)
			res.setHeader("Content-Disposition", `attachment; filename=${encodeURIComponent(src)}`);

		if (hashItem) await apiUtils.sendWithETag(req, res, hashItem, this.app.hashes);
	},
	[new MainMiddleware()],
);
