import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Command } from "../../types/Command";

const getPermission: Command<{ ctx: Context; catalogName: string; articlePath: Path }, string[]> = Command.create({
	path: "item/getPermission",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName, articlePath }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return [];
		if (!articlePath) return catalog.getNeededPermission().getValues();
		const item = catalog.findItemByItemPath(articlePath);
		if (item) return item.neededPermission.getValues();
		return [];
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = q.path ? new Path(q.path) : null;
		return { ctx, catalogName, articlePath };
	},
});

export default getPermission;
