import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import { Catalog, ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import { Item } from "@core/FileStructue/Item/Item";
import type RuleCollection from "@ext/events/RuleCollection";

export default class ViewLocalizationFilter implements RuleCollection, EventHandlerCollection {
	mount() {}

	getItemFilter() {
		const rule: ItemFilter = (item: Item, catalog: Catalog) => {
			if (!catalog.props.language) return true;
			if (item.props.external) return false;
			return true;
		};
		return rule;
	}
}
