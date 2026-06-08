import t from "@ext/localization/locale/translate";
import { type Property, PropertyTypes } from "@ext/properties/models";

export const flagPropertyValues = {
	selected: "selected",
} as const;

export interface FilterablePropertyItem {
	property: Property;
	selection: FilterablePropertySelection;
}

export interface FilterablePropertySelection {
	options: FilterablePropertyOption[];
	emptySelected: boolean;
	allSelected: boolean | "indeterminate";
}

export interface FilterablePropertyOption {
	value: string;
	selected: boolean;
}

export function getPropertyValueLabel(propertyType: Property["type"], value: string) {
	return propertyType === PropertyTypes.flag && value === flagPropertyValues.selected
		? t("properties.selected")
		: value;
}

export function getPropertyFilterValues(property: Property): string[] {
	if (property.type === PropertyTypes.flag) return [flagPropertyValues.selected];
	return property.values ?? [];
}

export function buildFilterableProperties(
	properties: Property[],
	filteredProperties: FilterablePropertyItem[],
	propertyQuery: string,
	propertyValuesQueries: Map<string, string>,
) {
	const selectedPropertiesMap = new Map(filteredProperties.map((item) => [item.property.id, item]));
	const shownArray: FilterablePropertyItem[] = [];
	const shownMap = new Map<string, FilterablePropertyItem>();
	const array: FilterablePropertyItem[] = [];
	const map = new Map<string, FilterablePropertyItem>();

	for (const property of properties) {
		const propertyItem = createFilterablePropertyItem(property, selectedPropertiesMap.get(property.id));
		array.push(propertyItem);
		map.set(property.id, propertyItem);

		if (propertyQuery && !property.id.toLowerCase().includes(propertyQuery)) continue;

		const shownPropertyItem = createItemWithFilteredValues(
			property,
			selectedPropertiesMap.get(property.id),
			propertyValuesQueries.get(property.id),
		);
		shownArray.push(shownPropertyItem);
		shownMap.set(property.id, shownPropertyItem);
	}

	return {
		filterableProperties: { array, map },
		shownFilterableProperties: { array: shownArray, map: shownMap },
	};
}

export function toggleFilterablePropertyValue(
	properties: FilterablePropertyItem[],
	availableProperties: Map<string, Property>,
	propertyName: string,
	value?: string,
): FilterablePropertyItem[] {
	const nextProperty = createNextProperty(properties, availableProperties, propertyName);
	if (!nextProperty) return properties;

	nextProperty.selection.options.forEach((x) => {
		x.selected = x.value === value ? !x.selected : x.selected;
	});
	nextProperty.selection.allSelected = isAllSelectedItem(nextProperty);

	return updateNextProperty(properties, nextProperty, availableProperties);
}

export function selectAllFilterablePropertyValues(
	properties: FilterablePropertyItem[],
	availableProperties: Map<string, Property>,
	propertyName: string,
): FilterablePropertyItem[] {
	const nextProperty = createNextProperty(properties, availableProperties, propertyName);
	if (!nextProperty) return properties;

	const shouldSelectAll = !nextProperty.selection.allSelected;
	nextProperty.selection.emptySelected = shouldSelectAll;
	nextProperty.selection.allSelected = shouldSelectAll;
	nextProperty.selection.options.forEach((x) => {
		x.selected = shouldSelectAll;
	});

	return updateNextProperty(properties, nextProperty, availableProperties);
}

export function selectEmptyFilterablePropertyValue(
	properties: FilterablePropertyItem[],
	availableProperties: Map<string, Property>,
	propertyName: string,
): FilterablePropertyItem[] {
	const nextProperty = createNextProperty(properties, availableProperties, propertyName);
	if (!nextProperty) return properties;

	nextProperty.selection.emptySelected = !nextProperty.selection.emptySelected;
	nextProperty.selection.allSelected = isAllSelectedItem(nextProperty);

	return updateNextProperty(properties, nextProperty, availableProperties);
}

export function getSelectedValues(item?: FilterablePropertyItem): string[] {
	if (!item) return [];
	return item.selection.options.filter((option) => option.selected).map((option) => option.value);
}

function updateNextProperty(
	properties: FilterablePropertyItem[],
	nextProperty: FilterablePropertyItem,
	availableProperties: Map<string, Property>,
): FilterablePropertyItem[] {
	const hasAnySelection =
		nextProperty.selection.emptySelected || nextProperty.selection.options.some((option) => option.selected);
	const nextProperties = properties.filter((item) => item.property.id !== nextProperty.property.id);
	if (!hasAnySelection) return nextProperties;

	nextProperties.push(nextProperty);
	return sortByAvailablePropertiesOrder(nextProperties, availableProperties);
}

function sortByAvailablePropertiesOrder(
	items: FilterablePropertyItem[],
	availableProperties: Map<string, Property>,
): FilterablePropertyItem[] {
	const order = new Map<string, number>();
	let i = 0;
	for (const name of availableProperties.keys()) {
		order.set(name, i++);
	}
	return items.sort(
		(a, b) =>
			(order.get(a.property.id) ?? Number.POSITIVE_INFINITY) -
			(order.get(b.property.id) ?? Number.POSITIVE_INFINITY),
	);
}

function createNextProperty(
	properties: FilterablePropertyItem[],
	availableProperties: Map<string, Property>,
	propertyName: string,
): FilterablePropertyItem | undefined {
	const currentProperty = properties.find((item) => item.property.id === propertyName);
	if (currentProperty) return cloneItem(currentProperty);

	const availableProperty = availableProperties.get(propertyName);
	if (!availableProperty) return undefined;

	const sourceProperty = createFilterablePropertyItem(availableProperty);

	return cloneItem(sourceProperty);
}

function cloneItem(property: FilterablePropertyItem): FilterablePropertyItem {
	return {
		property: property.property,
		selection: {
			options: property.selection.options.map((option) => ({ ...option })),
			emptySelected: property.selection.emptySelected,
			allSelected: property.selection.allSelected,
		},
	};
}

function createItemWithFilteredValues(
	property: Property,
	selectedProperty?: FilterablePropertyItem,
	filter?: string,
): FilterablePropertyItem {
	if (filter === undefined || !Array.isArray(property.values)) {
		return createFilterablePropertyItem(property, selectedProperty);
	}

	const filteredValues = property.values.filter((value) => value.toLowerCase().includes(filter));
	return createFilterablePropertyItem({ ...property, values: filteredValues }, selectedProperty);
}

function createFilterablePropertyItem(
	property: Property,
	selectedProperty?: FilterablePropertyItem,
): FilterablePropertyItem {
	const values = getPropertyFilterValues(property);
	const selectedValues = new Set(getSelectedValues(selectedProperty));
	const emptySelected = selectedProperty?.selection.emptySelected ?? false;

	return {
		property,
		selection: {
			options: values.map((value) => ({
				value,
				selected: selectedValues.has(value),
			})),
			emptySelected,
			allSelected: isAllSelected(values, emptySelected, selectedValues),
		},
	};
}

function isAllSelectedItem(item: FilterablePropertyItem): boolean | "indeterminate" {
	return isAllSelected(
		getPropertyFilterValues(item.property),
		item.selection.emptySelected,
		new Set(getSelectedValues(item)),
	);
}

function isAllSelected(
	values: string[],
	emptySelected: boolean,
	selectedValues: Set<string>,
): boolean | "indeterminate" {
	const allValuesSelected = values.every((value) => selectedValues.has(value));
	if (emptySelected && allValuesSelected) return true;
	if (emptySelected || selectedValues.size > 0) return "indeterminate";
	return false;
}
