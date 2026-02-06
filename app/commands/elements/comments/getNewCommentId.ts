import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import assert from "assert";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "../../../../core/logic/Api/middleware/DesktopModeMiddleware";
import { Command } from "../../../types/Command";

const getNewCommentId: Command<{ ctx: Context; catalogName: string }, string> = Command.create({
	path: "comments/getNewCommentId",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ ctx, catalogName }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);

		assert(catalog, "Catalog not found");
		const provider = catalog.customProviders.commentProvider;
		return provider.getNewCommentId();
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default getNewCommentId;
