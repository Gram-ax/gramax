import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import assert from "assert";

const deleteView: Command<{ ctx: Context; catalogName: string; viewId: string }, void> = Command.create({
	path: "catalog/views/delete",

	kind: ResponseKind.none,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, viewId }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		assert(catalog, "Catalog not found");

		await catalog.customProviders.viewProvider.deleteView(viewId);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const viewId = q.viewId;
		return { ctx, catalogName, viewId };
	},
});

export default deleteView;
