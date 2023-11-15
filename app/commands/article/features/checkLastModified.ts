import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { ArticleData } from "@core/SitePresenter/SitePresenter";
import { Command, ResponseKind } from "../../../types/Command";

const checkLastModified: Command<{ ctx: Context; articlePath: Path; catalogName: string }, ArticleData> =
	Command.create({
		path: "article/features/checkLastModified",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

		async do({ ctx, articlePath, catalogName }) {
			const { lib, sitePresenterFactory } = this._app;
			const catalog = await lib.getCatalog(catalogName);
			if (!catalog) return;

			const fp = lib.getFileProviderByCatalog(catalog);
			const itemRef = fp.getItemRef(articlePath);
			const article = catalog.findItemByItemRef(itemRef) as Article;

			if (!article) return;

			const stat = await fp.getStat(article.ref.path);
			await article.checkLastModified(stat.mtimeMs);
			return await sitePresenterFactory.fromContext(ctx).getArticleData(article, catalog);
		},

		params(ctx, q) {
			const articlePath = new Path(q.path);
			const catalogName = q.catalogName;
			return { ctx, articlePath, catalogName };
		},
	});

export default checkLastModified;
