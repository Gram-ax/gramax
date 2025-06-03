import { Property, PropertyValue } from "../models";

const combineProperties = (props: PropertyValue[], catalogProps: Map<string, Property>): Property[] => {
	return props?.map((prop) => {
		const originalProp = catalogProps.get(prop.name);
		if (!originalProp) return prop as Property;
		const value = Array.isArray(prop?.value) ? prop?.value : [prop?.value];
		return { ...originalProp, value: prop.value ? [...value] : undefined };
	});
};

export default combineProperties;
