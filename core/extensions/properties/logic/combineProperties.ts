import { Property, PropertyValue } from "../models";

const combineProperties = (props: PropertyValue[], catalogProps: Property[]) => {
	return props?.map((prop) => {
		const originalProp = catalogProps.find((p) => p.name === prop.name);
		if (!originalProp) return prop;
		return { ...originalProp, value: prop.value };
	});
};

export default combineProperties;
