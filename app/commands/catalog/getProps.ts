import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { Command } from "../../types/Command";

const getProps: Command<{ ctx: Context; catalogName: string }, ClientCatalogProps> = Command.create({
	path: "catalog/getProps",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName }) {
		const { wm, sitePresenterFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;
		return sitePresenterFactory.fromContext(ctx).serializeCatalogProps(catalog);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default getProps;
