import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";

const checkViews: Command<{ ctx: Context; catalogName: string }, { hasViews: boolean }> = Command.create({
	path: "catalog/views/check",

	kind: ResponseKind.json,

	async do({ catalogName }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) return { hasViews: false };

		const views = await catalog.customProviders.viewProvider.getViews(0, 1);
		return { hasViews: views.length > 0 };
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName };
	},
});

export default checkViews;
