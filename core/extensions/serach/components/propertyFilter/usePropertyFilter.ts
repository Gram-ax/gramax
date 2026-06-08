import { shouldPropertyVisible } from "@ext/properties/logic/shouldPropertyVisible";
import type { Property } from "@ext/properties/models";
import {
	buildFilterableProperties,
	type FilterablePropertyItem,
	selectAllFilterablePropertyValues,
	selectEmptyFilterablePropertyValue,
	toggleFilterablePropertyValue,
} from "@ext/serach/components/propertyFilter/propertyFilterModel";
import { useCallback, useMemo, useState } from "react";

interface UsePropertyFilterArgs {
	isReadOnlyPlatform: boolean;
	properties: Map<string, Property>;
}

interface UsePropertyFilterResult {
	filteredProperties: FilterablePropertyItem[];
	filterableProperties: {
		array: FilterablePropertyItem[];
		map: Map<string, FilterablePropertyItem>;
	};
	shownFilterableProperties: {
		array: FilterablePropertyItem[];
		map: Map<string, FilterablePropertyItem>;
	};
	propertySearch: {
		value: string;
		set: (q: string) => void;
	};
	propertyValuesSearch: {
		get: (name: string) => string;
		set: (name: string, q: string) => void;
	};
	togglePropertyValue: (name: string, value?: string) => void;
	selectAllPropertyValues: (name: string) => void;
	selectEmptyPropertyValue: (name: string) => void;
	clearFilteredProperties: () => void;
}

export function usePropertyFilter({ properties, isReadOnlyPlatform }: UsePropertyFilterArgs): UsePropertyFilterResult {
	const [filteredProperties, setFilteredProperties] = useState<FilterablePropertyItem[]>([]);
	const [propertyQuery, setPropertyQuery] = useState<string>("");
	const [propertyValuesQueries, setPropertyValuesQueries] = useState<Map<string, string>>(new Map());
	const { availableProperties, availablePropertiesMap } = useMemo(() => {
		const availableProperties = [...properties.values()].filter(
			(x) => filterablePropertyTypes[x.type] === true && shouldPropertyVisible(x, isReadOnlyPlatform),
		);
		const availablePropertiesMap = new Map(availableProperties.map((property) => [property.id, property]));
		return { availableProperties, availablePropertiesMap };
	}, [properties, isReadOnlyPlatform]);

	const { filterableProperties, shownFilterableProperties } = useMemo(
		() => buildFilterableProperties(availableProperties, filteredProperties, propertyQuery, propertyValuesQueries),
		[availableProperties, filteredProperties, propertyQuery, propertyValuesQueries],
	);

	return {
		filteredProperties,
		filterableProperties,
		shownFilterableProperties,
		propertySearch: {
			value: propertyQuery,
			set: useCallback((q) => setPropertyQuery(q.toLowerCase()), []),
		},
		propertyValuesSearch: {
			get: useCallback((name) => propertyValuesQueries.get(name) ?? "", [propertyValuesQueries]),
			set: useCallback(
				(name, q) => {
					const newMap = new Map(propertyValuesQueries);
					newMap.set(name, q.toLowerCase());
					setPropertyValuesQueries(newMap);
				},
				[propertyValuesQueries],
			),
		},
		togglePropertyValue: useCallback(
			(name: string, value?: string) =>
				setFilteredProperties((prev) =>
					toggleFilterablePropertyValue(prev, availablePropertiesMap, name, value),
				),
			[availablePropertiesMap],
		),
		selectAllPropertyValues: useCallback(
			(name: string) =>
				setFilteredProperties((prev) => selectAllFilterablePropertyValues(prev, availablePropertiesMap, name)),
			[availablePropertiesMap],
		),
		selectEmptyPropertyValue: useCallback(
			(name: string) =>
				setFilteredProperties((prev) => selectEmptyFilterablePropertyValue(prev, availablePropertiesMap, name)),
			[availablePropertiesMap],
		),
		clearFilteredProperties: useCallback(() => setFilteredProperties([]), []),
	};
}

const filterablePropertyTypes: Partial<Record<Property["type"], boolean>> = {
	Enum: true,
	Flag: true,
	Many: true,
};
