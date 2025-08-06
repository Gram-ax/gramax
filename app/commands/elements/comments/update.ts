import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "../../../../core/logic/Api/middleware/DesktopModeMiddleware";
import Path from "../../../../core/logic/FileProvider/Path/Path";
import { Command } from "../../../types/Command";
import { CommentBlock } from "@core-ui/CommentBlock";
import Context from "@core/Context/Context";
import { Article } from "@core/FileStructue/Article/Article";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import assert from "assert";

const updateComment: Command<
	{ ctx: Context; catalogName: string; articlePath: Path; commentId: string; comment: CommentBlock },
	void
> = Command.create({
	path: "comments/update",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ ctx, articlePath, commentId, catalogName, comment }) {
		const { parserContextFactory } = this._app;
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		assert(catalog, "Catalog not found");

		const article = catalog.findItemByItemPath<Article>(articlePath);
		assert(article, "Article not found");

		const context = await parserContextFactory.fromArticle(
			article,
			catalog,
			convertContentToUiLanguage(ctx.contentLanguage || catalog.props.language),
			ctx.user.isLogged,
		);

		const provider = catalog.customProviders.commentProvider;
		await provider.saveComment(commentId, comment, articlePath, context);
	},

	params(ctx, q, body) {
		const articlePath = new Path(q.articlePath);
		const commentId = q.id;
		const catalogName = q.catalogName;
		const comment = body as CommentBlock;
		return { ctx, articlePath, commentId, catalogName, comment };
	},
});

export default updateComment;
