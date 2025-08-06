import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "../../../../core/logic/Api/middleware/DesktopModeMiddleware";
import Path from "../../../../core/logic/FileProvider/Path/Path";
import { Command } from "../../../types/Command";
import assert from "assert";

const deleteComment: Command<{ ctx: Context; articlePath: Path; id: string; catalogName: string }, void> =
	Command.create({
		path: "comments/delete",

		middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ ctx, articlePath, id, catalogName }) {
			const workspace = this._app.wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);
			assert(catalog, "Catalog not found");

			const provider = catalog.customProviders.commentProvider;
			await provider.deleteComment(id, articlePath);
		},

		params(ctx, q) {
			const id = q.id;
			const articlePath = new Path(q.articlePath);
			const catalogName = q.catalogName;
			return { ctx, articlePath, id, catalogName };
		},
	});

export default deleteComment;
