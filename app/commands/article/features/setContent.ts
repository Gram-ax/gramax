import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import { Command, ResponseKind } from "../../../types/Command";

const setContent: Command<{ ctx: Context; catalogName: string; articlePath: Path; content: string }, ArticlePageData> =
	Command.create({
		path: "article/features/setContent",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ ctx, articlePath, catalogName, content }) {
			const { sitePresenterFactory, lib } = this._app;
			const catalog = await lib.getCatalog(catalogName);
			const article = catalog.findItemByItemPath<Article>(articlePath);
			if (!article) return;
			await article.updateContent(content ?? "");
			return await sitePresenterFactory.fromContext(ctx).getArticlePageData(article, catalog);
		},

		params(ctx, q, body) {
			const articlePath = new Path(q.path);
			const catalogName = q.catalogName;
			return { ctx, articlePath, catalogName, content: body };
		},
	});

export default setContent;
