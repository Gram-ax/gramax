import type { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import { Category } from "@core/FileStructue/Category/Category";
import type { Item } from "@core/FileStructue/Item/Item";
import CategoryItemFilter from "@ext/catalog/views/logic/utils/CategoryItemFilter";
import type RuleCollection from "@ext/rules/RuleCollection";

export default class CatalogViewRules implements RuleCollection {
	private _filter = new CategoryItemFilter();

	constructor(private _catalog: ContextualCatalog) {}

	getItemFilter(): ItemFilter {
		return (item: Item) => {
			const view = this._catalog.props.resolvedView;
			if (!view) return true;
			if (item instanceof Category) {
				const filtered = this._filter.filter(item.items, view);
				if (filtered.length > 0) return true;
				return this._filter.matchesFilter(item, view);
			}
			return this._filter.matchesFilter(item, view);
		};
	}
}
