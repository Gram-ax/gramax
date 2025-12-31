import type { Property } from "@ext/properties/models";

export const shouldPropertyVisible = (property: Property, isReadOnly?: boolean) => {
	if (isReadOnly) return property.options?.docportalVisible;
	return true;
};
