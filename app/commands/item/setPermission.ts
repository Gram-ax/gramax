import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Path from "@core/FileProvider/Path/Path";
import Permission from "@ext/security/logic/Permission/Permission";
import { Command } from "../../types/Command";
import type Context from "@core/Context/Context";

const setPermission: Command<{ ctx: Context; catalogName: string; path?: Path; permissions: Permission }, void> = Command.create({
	path: "item/setPermission",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, path, permissions }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);

		if (!path) return catalog.updateNeededPermission(permissions);

		const item = catalog.findItemByItemPath(path);
		if (item) await item.setNeededPermission(permissions);
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const path = q.path ? new Path(q.path) : null;
		const permissions = new Permission(body);
		return { ctx, catalogName, path, permissions };
	},
});

export default setPermission;
