import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";

export interface ItemFilterOptions {
	requireExactLanguageMatch: boolean;
}

interface RuleCollection {
	getItemFilter(options?: ItemFilterOptions): ItemFilter;
}

export default RuleCollection;
