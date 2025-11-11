import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "../../../../core/logic/Api/middleware/DesktopModeMiddleware";
import Path from "../../../../core/logic/FileProvider/Path/Path";
import { Command } from "../../../types/Command";
import Context from "@core/Context/Context";
import { Article } from "@core/FileStructue/Article/Article";
import assert from "assert";

const copyComment: Command<
	{ ctx: Context; catalogName: string; articlePath: Path; commentId: string; copyPath: Path },
	boolean
> = Command.create({
	path: "comments/copy",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ ctx, articlePath, commentId, catalogName, copyPath }) {
		const { parserContextFactory } = this._app;
		const workspace = this._app.wm.current();
		const currentCatalog = await workspace.getCatalog(catalogName, ctx);
		assert(currentCatalog, "Current catalog not found");

		const currentArticle = currentCatalog.findItemByItemPath<Article>(articlePath);
		assert(currentArticle, "Current article not found");

		const provider = currentCatalog.customProviders.commentProvider;
		return await provider.copyComment(
			commentId,
			copyPath,
			currentArticle.ref.path,
			workspace,
			parserContextFactory,
			ctx,
		);
	},

	params(ctx, q) {
		const articlePath = new Path(q.articlePath);
		const commentId = q.id;
		const catalogName = q.catalogName;
		const copyPath = new Path(q.copyPath);
		return { ctx, articlePath, commentId, catalogName, copyPath };
	},
});

export default copyComment;
