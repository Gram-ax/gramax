import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import CategoryItemFilter from "@ext/catalog/views/logic/utils/CategoryItemFilter";
import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";

export default class ContextualCatalogViewEvents implements EventHandlerCollection {
	private _resolvedView: CatalogView;
	private _filter = new CategoryItemFilter();

	constructor(private readonly _catalog: ContextualCatalog) {}

	mount() {
		if (this._catalog.ctx.viewId?.[this._catalog.name]) {
			const viewProvider = this._catalog.deref.customProviders.viewProvider;

			this._resolvedView = viewProvider.getLoadedViewById(this._catalog.ctx.viewId[this._catalog.name]) ?? null;
			if (!this._resolvedView) delete this._catalog.ctx.viewId[this._catalog.name];

			if (!Object.keys(this._catalog.ctx.viewId).length) this._catalog.ctx.cookie.remove("viewIds");
			else this._catalog.ctx.cookie.set("viewIds", JSON.stringify(this._catalog.ctx.viewId));
		} else this._resolvedView = null;

		this._catalog.events.on("props-resolve", ({ mutableProps }) => {
			if (!this._resolvedView) return;
			mutableProps.props = { ...mutableProps.props, resolvedView: this._resolvedView };
		});

		this._catalog.events.on("items-filter", ({ mutable }) => {
			if (!this._resolvedView) return;
			mutable.items = this._filter.filter(mutable.items, this._resolvedView, (category) => category.items);
		});
	}
}
