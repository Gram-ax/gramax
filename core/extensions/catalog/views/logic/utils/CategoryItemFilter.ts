import type { Category } from "@core/FileStructue/Category/Category";
import type { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";

export default class CategoryItemFilter {
	filter(items: Item[], view: CatalogView, getChildren: (category: Category) => Item[] = (c) => c.items): Item[] {
		if (!view.filters || view.filters.length === 0) return items;

		return items.filter((item) => {
			if (item.type === ItemType.category) {
				const children = getChildren(item as Category);
				if (this.filter(children, view, getChildren).length > 0) return true;
				return this.matchesFilter(item, view);
			}
			return this.matchesFilter(item, view);
		});
	}

	matchesFilter(item: Item, view: CatalogView): boolean {
		if (!view.filters || view.filters.length === 0) return true;

		return view.filters.every((filter) => {
			const itemProperty = item.props.properties?.find((p) => p.id === filter.id);

			if (itemProperty?.value?.length && itemProperty.value?.every((v) => filter.value?.includes(v))) {
				return false;
			}

			if (filter.value?.includes("yes") && filter.value?.includes("none")) return false;
			if (filter.value?.includes("yes")) return !itemProperty;
			if (filter.value?.includes("none")) return !!itemProperty;

			return true;
		});
	}
}
