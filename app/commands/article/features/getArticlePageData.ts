import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type { ArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import { Command } from "../../../types/Command";

const getArticlePageData: Command<{ ctx: Context; articlePath: Path; catalogName: string }, ArticlePageData> =
	Command.create({
		path: "article/features/getArticlePageData",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware()],

		async do({ ctx, articlePath, catalogName }) {
			const { sitePresenterFactory, wm } = this._app;
			const workspace = wm.current();
			const catalog = await workspace.getContextlessCatalog(catalogName);
			if (!catalog || !catalog.getRootCategory().items.length) return;

			const fp = workspace.getFileProvider();
			const itemRef = fp.getItemRef(articlePath);
			const article = catalog.findItemByItemRef<Article>(itemRef);
			if (!article || article.props.welcome) return;

			return await sitePresenterFactory.fromContext(ctx).getArticlePageData(article, catalog);
		},

		params(ctx, q) {
			const articlePath = new Path(q.path);
			const catalogName = q.catalogName;
			return { ctx, articlePath, catalogName };
		},
	});

export default getArticlePageData;
