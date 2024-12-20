import { getInputType, PropertyTypes } from "@ext/properties/models";

const getDisplayValue = (type: PropertyTypes, value: string[] | string) => {
	if (!getInputType[type]) return Array.isArray(value) ? value.join(", ") : value;
	if (type === PropertyTypes.date) {
		const date = new Date(value[0]);
		return date.toLocaleDateString();
	}
	return value[0];
};

export default getDisplayValue;
