import CommentProvider from "../../../core/extensions/markdown/elements/comment/edit/logic/CommentProvider";
import { AuthorizeMiddleware } from "../../../core/logic/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "../../../core/logic/Api/middleware/DesktopModeMiddleware";
import Path from "../../../core/logic/FileProvider/Path/Path";
import { Command } from "../../types/Command";

const deleteComment: Command<{ catalogName: string; articlePath: Path; count: string }, void> = Command.create({
	path: "comments/deleteComment",

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ catalogName, articlePath, count }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProviderByCatalog(catalog);
		return await new CommentProvider(fp, articlePath).deleteComment(count);
	},

	params(ctx, q) {
		const count = q.count;
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		return { ctx, catalogName, articlePath, count };
	},
});

export default deleteComment;
