import t from "@ext/localization/locale/translate";
import { shouldPropertyVisible } from "@ext/properties/logic/shouldPropertyVisible";
import { Property, PropertyTypes } from "@ext/properties/models";
import {
	cloneProperty,
	filterPropertiesBySearch,
	togglePropertyValue,
} from "@ext/serach/components/utils/propertyUtils";
import { useMemo, useState } from "react";

interface UsePropertyFilterArgs {
	isReadOnlyPlatform: boolean;
	properties: Map<string, Property>;
}

interface UsePropertyFilterResult {
	filteredProperties: Property[];
	filterableProperties: {
		array: Property[];
		map: Map<string, Property>;
	};
	shownFilterableProperties: {
		array: Property[];
		map: Map<string, Property>;
	};
	propertySearch: {
		value: string;
		set: (q: string) => void;
	};
	propertiyValuesSearch: {
		get: (name: string) => string;
		set: (name: string, q: string) => void;
	};
	togglePropertyValue: (name: string, value?: string) => void;
	clearFilteredProperty: (name: string) => void;
	clearFilteredProperties: () => void;
}

export function usePropertyFilter({ properties, isReadOnlyPlatform }: UsePropertyFilterArgs): UsePropertyFilterResult {
	const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
	const [propertyQuery, setPropertyQuery] = useState<string>("");
	const [propertyValuesQueries, setPropertyValuesQueries] = useState<Map<string, string>>(new Map());

	const { filterableProperties, shownFilterableProperties } = useMemo(
		() =>
			filterPropertiesBySearch(
				[...properties.values()]
					.filter(
						(x) => filterablePropertyTypes[x.type] === true && shouldPropertyVisible(x, isReadOnlyPlatform),
					)
					.map((x) => {
						if (x.type !== PropertyTypes.flag) return x;

						// TODO: Hack to add state selection to flags
						// Should go away when switch to FilterMenu
						const cloned = cloneProperty(x);
						cloned.type = PropertyTypes.enum;
						cloned.values = [t("yes"), t("no")];
						return cloned;
					}),
				propertyQuery,
				propertyValuesQueries,
			),
		[properties, propertyQuery, propertyValuesQueries],
	);

	return {
		filteredProperties,
		filterableProperties,
		shownFilterableProperties,
		propertySearch: {
			value: propertyQuery,
			set: (q) => setPropertyQuery(q.toLowerCase()),
		},
		propertiyValuesSearch: {
			get: (name) => propertyValuesQueries.get(name) ?? "",
			set: (name, q) => {
				const newMap = new Map(propertyValuesQueries);
				newMap.set(name, q.toLowerCase());
				setPropertyValuesQueries(newMap);
			},
		},
		togglePropertyValue: (name: string, value?: string) =>
			setFilteredProperties((prev) => togglePropertyValue(prev, filterableProperties.map, name, value)),
		clearFilteredProperty: (name: string) => setFilteredProperties((prev) => prev.filter((x) => x.name !== name)),
		clearFilteredProperties: () => setFilteredProperties([]),
	};
}

const filterablePropertyTypes: Partial<Record<PropertyTypes, boolean>> = {
	Enum: true,
	Flag: true,
	Many: true,
};
