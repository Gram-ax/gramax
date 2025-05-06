import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { ArticlePageData, GetArticlePageDataOptions } from "@core/SitePresenter/SitePresenter";
import { Command } from "../../../types/Command";

const setContent: Command<
	{ ctx: Context; catalogName: string; articlePath: Path; content: string; rawMarkdown: boolean },
	ArticlePageData
> = Command.create({
	path: "article/features/setContent",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, articlePath, catalogName, content, rawMarkdown }) {
		const { sitePresenterFactory, wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		const article = catalog.findItemByItemPath<Article>(articlePath);
		if (!article) return;
		if (rawMarkdown) await article.rawUpdateContent(content ?? "");
		else await article.updateContent(content ?? "");

		const opts: GetArticlePageDataOptions = {
			editableContent: !this._app.conf.isReadOnly,
			markdown: this._app.conf.isReadOnly,
		};

		return await sitePresenterFactory.fromContext(ctx).getArticlePageData(article, catalog, opts);
	},

	params(ctx, q, body) {
		const articlePath = new Path(q.path);
		const catalogName = q.catalogName;
		const rawMarkdown = q.rawMarkdown === "true";
		return { ctx, articlePath, catalogName, content: body, rawMarkdown };
	},
});

export default setContent;
