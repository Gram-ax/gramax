import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import type { Article } from "@core/FileStructue/Article/Article";
import assert from "assert";

const applyView: Command<{ ctx: Context; catalogName: string; viewId: string }, void> = Command.create({
	path: "catalog/views/apply",

	kind: ResponseKind.none,

	async do({ catalogName, viewId, ctx }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		assert(catalog, "Catalog not found");

		await catalog.customProviders.viewProvider.applyView(catalog, viewId);

		for (const article of catalog.getItems()) {
			await (article as Article).parsedContent.write(() => null);
		}
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const viewId = q.viewId;
		return { ctx, catalogName, viewId };
	},
});

export default applyView;
