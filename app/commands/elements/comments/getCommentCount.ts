import { ResponseKind } from "@app/types/ResponseKind";
import CommentProvider from "../../../../core/extensions/markdown/elements/comment/edit/logic/CommentProvider";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "../../../../core/logic/Api/middleware/DesktopModeMiddleware";
import Path from "../../../../core/logic/FileProvider/Path/Path";
import { Command } from "../../../types/Command";

const getCommentsCount: Command<{ catalogName: string; articlePath: Path }, string> = Command.create({
	path: "comments/getCommentCount",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ catalogName, articlePath }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProviderByCatalog(catalog);
		return await new CommentProvider(fp, articlePath).getCount();
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		return { ctx, catalogName, articlePath };
	},
});

export default getCommentsCount;
