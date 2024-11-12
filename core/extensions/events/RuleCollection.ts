import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";

interface RuleCollection {
	getItemFilter(): ItemFilter;
}

export default RuleCollection;
