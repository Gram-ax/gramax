import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import { NavRules } from "@ext/navigation/catalog/main/logic/Navigation";

interface Rules {
	getNavRules(): NavRules;
	getItemFilter(): ItemFilter;
}

export default Rules;
