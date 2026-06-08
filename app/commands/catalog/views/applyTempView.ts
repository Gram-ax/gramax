import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import type { Article } from "@core/FileStructue/Article/Article";
import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";
import assert from "assert";

const applyTempView: Command<{ ctx: Context; catalogName: string; view: CatalogView }, void> = Command.create({
	path: "catalog/views/applyTemp",

	kind: ResponseKind.none,

	middlewares: [new DesktopModeMiddleware()],

	async do({ catalogName, view, ctx }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		assert(catalog, "Catalog not found");

		await catalog.customProviders.viewProvider.applyTempView(catalog, view);

		for (const article of catalog.getItems()) {
			await (article as Article).parsedContent.write(() => null);
		}
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const view = body as CatalogView;
		return { ctx, catalogName, view };
	},
});

export default applyTempView;
