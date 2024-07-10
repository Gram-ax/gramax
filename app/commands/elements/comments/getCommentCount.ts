import { ResponseKind } from "@app/types/ResponseKind";
import CommentProvider from "../../../../core/extensions/markdown/elements/comment/edit/logic/CommentProvider";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "../../../../core/logic/Api/middleware/DesktopModeMiddleware";
import Path from "../../../../core/logic/FileProvider/Path/Path";
import { Command } from "../../../types/Command";

const getCommentsCount: Command<{ articlePath: Path }, string> = Command.create({
	path: "comments/getCommentCount",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	do({ articlePath }) {
		const workspace = this._app.wm.current();
		const fp = workspace.getFileProvider();
		return new CommentProvider(fp, articlePath).getCount();
	},

	params(ctx, q) {
		const articlePath = new Path(q.articlePath);
		return { ctx, articlePath };
	},
});

export default getCommentsCount;
