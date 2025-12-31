import { Property, PropertyTypes } from "@ext/properties/models";

export function togglePropertyValue(
	properties: Property[],
	availableProperties: Map<string, Property>,
	propName: string,
	value?: string,
): Property[] {
	let found = false;
	const newProps = properties
		.map((x) => {
			if (x.name !== propName) return x;

			found = true;
			if (x.type === PropertyTypes.flag) return undefined;

			const cloned = cloneProperty(x);
			let removed: boolean = false;
			cloned.value = cloned.value?.filter((y) => {
				if (y !== value) return true;
				removed = true;
				return false;
			});

			if (removed && Array.isArray(cloned.value) && cloned.value.length === 0) return undefined;

			if (!removed) {
				cloned.value ??= [];
				cloned.value.push(value);
			}

			return cloned;
		})
		.filter((x) => x !== undefined);

	if (!found) {
		const property = availableProperties.get(propName);
		if (property !== undefined) {
			const cloned = cloneProperty(property);
			if (cloned.type !== PropertyTypes.flag) cloned.value = [value];
			newProps.push(cloned);
		}
	}

	return newProps;
}

export function filterPropertiesBySearch(
	properties: Property[],
	propertyQuery: string,
	propertyValuesQueries: Map<string, string>,
) {
	const shownArray: Property[] = [];
	const shownMap = new Map<string, Property>();
	const array: Property[] = [];
	const map = new Map<string, Property>();

	for (const property of properties) {
		const cloned = cloneProperty(property);
		array.push(cloned);
		map.set(cloned.name, cloned);

		if (propertyQuery && !cloned.name.toLowerCase().includes(propertyQuery)) continue;

		const shownCloned = cloneProperty(cloned);

		const propertyValuesQuery = propertyValuesQueries.get(shownCloned.name);
		if (propertyValuesQuery !== undefined && Array.isArray(shownCloned.values)) {
			shownCloned.values = shownCloned.values.filter((x) => x.toLowerCase().includes(propertyValuesQuery));
		}

		shownArray.push(shownCloned);
		shownMap.set(shownCloned.name, shownCloned);
	}

	return {
		filterableProperties: { array, map },
		shownFilterableProperties: { array: shownArray, map: shownMap },
	};
}

export function cloneProperty(prop: Property): Property {
	return {
		...prop,
		values: [...(prop.values ?? [])],
		value: [...(prop.value ?? [])],
	};
}
