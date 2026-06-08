import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";
import assert from "assert";

const getViews: Command<
	{ ctx: Context; catalogName: string; offset: number; limit: number; search?: string },
	{ views: CatalogView[]; hasMore: boolean }
> = Command.create({
	path: "catalog/views/get",

	kind: ResponseKind.json,

	async do({ catalogName, offset, limit, search }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		assert(catalog, "Catalog not found");

		const isReadOnly = this._app.conf.isReadOnly;
		const views = await catalog.customProviders.viewProvider.getViews(offset, limit + 1, search, { isReadOnly });
		const hasMore = views.length > limit;

		return { views, hasMore };
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const offset = +q.offset;
		const limit = +q.limit;
		const search = q.search;
		return { ctx, catalogName, offset, limit, search };
	},
});

export default getViews;
