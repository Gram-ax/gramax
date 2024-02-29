import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import DefaultError from "../../../../core/extensions/errorHandlers/logic/DefaultError";
import { Command, ResponseKind } from "../../../types/Command";

const checkLastModified: Command<{ ctx: Context; articlePath: Path; catalogName: string }, ArticlePageData> =
	Command.create({
		path: "article/features/checkLastModified",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware()],

		async do({ ctx, articlePath, catalogName }) {
			const { lib, sitePresenterFactory } = this._app;
			const catalog = await lib.getCatalog(catalogName);
			if (!catalog || !catalog.getRootCategory().items.length) return;

			const fp = lib.getFileProviderByCatalog(catalog);
			const itemRef = fp.getItemRef(articlePath);
			const article = catalog.findItemByItemRef<Article>(itemRef);
			if (!article || article.props.welcome) return;
			let res = false;

			try {
				const stat = await fp.getStat(article.ref.path);
				res = await article.checkLastModified(stat.mtimeMs);
			} catch (e) {
				if (e?.code === "ENOENT") throw new DefaultError(null, e, { errorCode: e?.code });
			}

			return res ? await sitePresenterFactory.fromContext(ctx).getArticlePageData(article, catalog) : null;
		},

		params(ctx, q) {
			const articlePath = new Path(q.path);
			const catalogName = q.catalogName;
			return { ctx, articlePath, catalogName };
		},
	});

export default checkLastModified;
