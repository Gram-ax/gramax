import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { ArticleData } from "@core/SitePresenter/SitePresenter";
import { Command, ResponseKind } from "../../../types/Command";

const setContent: Command<{ ctx: Context; catalogName: string; articlePath: Path; content: string }, ArticleData> =
	Command.create({
		path: "article/features/setContent",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

		async do({ ctx, articlePath, catalogName, content }) {
			const { sitePresenterFactory, lib } = this._app;
			const catalog = await lib.getCatalog(catalogName);
			const article = catalog.findItemByItemPath(articlePath) as Article;
			if (!article) return;
			await article.updateContent(content ?? "");
			return await sitePresenterFactory.fromContext(ctx).getArticleData(article, catalog);
		},

		params(ctx, q, body) {
			const articlePath = new Path(q.path);
			const catalogName = q.catalogName;
			return { ctx, articlePath, catalogName, content: body };
		},
	});

export default setContent;
