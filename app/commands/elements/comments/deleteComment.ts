import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import CommentProvider from "../../../../core/extensions/markdown/elements/comment/edit/logic/CommentProvider";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "../../../../core/logic/Api/middleware/DesktopModeMiddleware";
import Path from "../../../../core/logic/FileProvider/Path/Path";
import { Command } from "../../../types/Command";

const deleteComment: Command<{ articlePath: Path; count: string }, void> = Command.create({
	path: "comments/deleteComment",

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ articlePath, count }) {
		const workspace = this._app.wm.current();
		const fp = workspace.getFileProvider();
		return await new CommentProvider(fp, articlePath).deleteComment(count);
	},

	params(ctx, q) {
		const count = q.count;
		const articlePath = new Path(q.articlePath);
		return { ctx, articlePath, count };
	},
});

export default deleteComment;
