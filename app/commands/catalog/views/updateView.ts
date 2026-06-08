import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";
import assert from "assert";

const updateView: Command<{ ctx: Context; catalogName: string; view: CatalogView }, void> = Command.create({
	path: "catalog/views/update",

	kind: ResponseKind.none,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, view }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		assert(catalog, "Catalog not found");

		await catalog.customProviders.viewProvider.updateView(view);
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const view = body as CatalogView;
		return { ctx, catalogName, view };
	},
});

export default updateView;
