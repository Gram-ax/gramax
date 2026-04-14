import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { PropertyFilter } from "@ext/serach/Searcher";

export function getCatalogPropertyFilter(
	catalog: Catalog,
	additionalFilter?: PropertyFilter,
): PropertyFilter | undefined {
	if (catalog.props.filterProperty && catalog.props.resolvedFilterPropertyValue) {
		const filter: PropertyFilter = {
			op: "contains",
			key: catalog.props.filterProperty,
			list: [catalog.props.resolvedFilterPropertyValue],
		};

		return additionalFilter
			? {
					op: "and",
					filters: [additionalFilter, filter],
				}
			: filter;
	}

	return additionalFilter;
}
