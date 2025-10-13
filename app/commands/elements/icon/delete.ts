import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import assert from "assert";

const create: Command<{ ctx: Context; catalogName: string; code: string }, void> = Command.create({
	path: "elements/icon/delete",

	kind: ResponseKind.none,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, code }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		assert(catalog, "Catalog not found");
		return await catalog.customProviders.iconProvider.delete(code);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const code = q.code;
		return { ctx, catalogName, code };
	},
});

export default create;
