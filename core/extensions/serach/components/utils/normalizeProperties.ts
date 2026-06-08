import type { Property, PropertyValue } from "@ext/properties/models";

export const normalizeCatalogProperties = (properties: Property[]): Property[] => {
	return properties?.map((prop) => ({ ...prop, id: prop.id ?? prop.name }));
};

export const normalizeArticleProperties = (
	properties: PropertyValue[],
	catalogProperties?: Property[],
): PropertyValue[] => {
	if (!Array.isArray(properties)) return [];

	return properties.map((prop) => {
		const id = prop.id ?? (prop as unknown as { name: string }).name;
		const originalProp = catalogProperties?.find((p) => (p.id || p.name) === id);
		const currentValue = Array.isArray(prop.value)
			? [...prop.value]
			: prop.value != null
				? [prop.value]
				: undefined;

		if (!originalProp) return { id, ...(currentValue !== undefined && { value: currentValue }) };
		return { id: originalProp.id ?? originalProp.name, ...(currentValue !== undefined && { value: currentValue }) };
	});
};
