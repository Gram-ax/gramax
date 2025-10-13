import { Property, PropertyValue } from "@ext/properties/models";

export const getPropertyValue = (property: Property): PropertyValue => {
	return { name: property.name, value: property.value };
};
