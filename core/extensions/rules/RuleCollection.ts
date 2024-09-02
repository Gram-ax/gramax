import type { HasEvents } from "@core/Event/EventEmitter";
import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import { type NavigationEvents } from "@ext/navigation/catalog/main/logic/Navigation";

interface RuleCollection {
	mountNavEvents(nav: HasEvents<NavigationEvents>): void;
	getItemFilter(): ItemFilter;
}

export default RuleCollection;
