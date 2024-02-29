import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import Permission from "@ext/security/logic/Permission/Permission";
import { Command, ResponseKind } from "../../types/Command";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";

const setPermission: Command<{ catalogName: string; path?: Path; permissions: Permission }, void> = Command.create({
	path: "item/setPermission",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, path, permissions }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);

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
