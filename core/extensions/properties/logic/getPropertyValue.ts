import type { Property, PropertyValue } from "@ext/properties/models";

export const getPropertyValue = (property: Property): PropertyValue => {
	return { id: property.id, value: property.value };
};
