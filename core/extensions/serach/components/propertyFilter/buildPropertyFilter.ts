import { PropertyTypes } from "@ext/properties/models";
import {
	type FilterablePropertyItem,
	getSelectedValues,
} from "@ext/serach/components/propertyFilter/propertyFilterModel";
import type { PropertyFilter } from "@ext/serach/Searcher";

export const buildPropertyFilter = (filteredProperties: FilterablePropertyItem[]): PropertyFilter | undefined => {
	if (filteredProperties.length === 0) {
		return undefined;
	}

	return {
		op: "and",
		filters: filteredProperties.map(filterableItemToPropertyFilter),
	};
};

const filterableItemToPropertyFilter = (item: FilterablePropertyItem): PropertyFilter => {
	const key = item.property.id;
	const selectedValues = getSelectedValues(item);
	const withEmpty = item.selection.emptySelected;

	if (item.property.type === PropertyTypes.flag) {
		return propertyFilterForFlag(key, selectedValues.length > 0, withEmpty);
	}
	return propertyFilterForList(key, selectedValues, withEmpty);
};

const propertyFilterForList = (key: string, list: string[], withEmpty: boolean): PropertyFilter => {
	const filter: PropertyFilter = { op: "contains", key, list };
	return withEmptyIfNeeded(key, list.length > 0, withEmpty, filter);
};

const propertyFilterForFlag = (key: string, hasSelected: boolean, withEmpty: boolean): PropertyFilter => {
	const filter: PropertyFilter = { op: "eq", key, value: true };
	return withEmptyIfNeeded(key, hasSelected, withEmpty, filter);
};

const withEmptyIfNeeded = (
	key: string,
	hasValues: boolean,
	hasEmpty: boolean,
	filter: PropertyFilter,
): PropertyFilter => {
	if (hasValues && hasEmpty) return orFilter(filter, isEmptyFilter(key));
	if (hasEmpty) return isEmptyFilter(key);
	return filter;
};

const isEmptyFilter = (key: string): PropertyFilter => {
	return { op: "isEmpty", key };
};

const orFilter = (...filters: PropertyFilter[]): PropertyFilter => {
	return { op: "or", filters };
};
