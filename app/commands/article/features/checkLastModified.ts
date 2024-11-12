import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import FileStructueErrorCode from "@core/FileStructue/error/model/FileStructueErrorCode";
import { ArticlePageData, GetArticlePageDataOptions } from "@core/SitePresenter/SitePresenter";
import DefaultError from "../../../../core/extensions/errorHandlers/logic/DefaultError";
import { Command } from "../../../types/Command";

const checkLastModified: Command<{ ctx: Context; articlePath: Path; catalogName: string }, ArticlePageData> =
	Command.create({
		path: "article/features/checkLastModified",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware()],

		async do({ ctx, articlePath, catalogName }) {
			const { sitePresenterFactory, wm } = this._app;
			const workspace = wm.current();
			const catalog = await workspace.getCatalog(catalogName);
			if (!catalog || !catalog.getRootCategory().items.length) return;

			const fp = workspace.getFileProvider();
			const itemRef = fp.getItemRef(articlePath);
			const article = catalog.findItemByItemRef<Article>(itemRef);
			if (!article || article.props.welcome) return;
			let res = false;

			try {
				const stat = await fp.getStat(article.ref.path);
				res = await article.checkLastModified(stat.mtimeMs);
			} catch (e) {
				if (e?.code === "ENOENT")
					throw new DefaultError(null, e, { errorCode: FileStructueErrorCode.ArticleNotFoundError });
			}

			const opts: GetArticlePageDataOptions = {
				editableContent: !this._app.conf.isReadOnly,
				markdown: this._app.conf.isReadOnly,
			};

			return res ? await sitePresenterFactory.fromContext(ctx).getArticlePageData(article, catalog, opts) : null;
		},

		params(ctx, q) {
			const articlePath = new Path(q.path);
			const catalogName = q.catalogName;
			return { ctx, articlePath, catalogName };
		},
	});

export default checkLastModified;
