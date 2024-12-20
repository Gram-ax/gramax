import sortMapByName from "@ext/markdown/elements/view/render/logic/sortMap";
import { isHasValue, isManyProperty, Property, PropertyValue } from "@ext/properties/models";

const deleteProperty = (
	propertyName: string,
	properties: Property[] | PropertyValue[],
	returnFull?: boolean,
): Property[] | PropertyValue[] => {
	return properties
		.filter((prop) => prop.name !== propertyName)
		.map((prop) => (returnFull ? prop : { name: prop.name, value: prop.value }));
};

const getNewValue = (property: Property, value: string): string => {
	return property.values && value ? value : value ?? null;
};

const addOrUpdateProperty = (
	properties: Property[] | PropertyValue[],
	property: Property,
	newValue: string,
	returnFull: boolean,
): Property[] | PropertyValue[] => {
	return [
		...(returnFull ? properties : properties.map((prop) => ({ name: prop.name, value: prop.value }))),
		(!returnFull && {
			name: property.name,
			...(newValue !== null && { value: Array.isArray(newValue) ? newValue : [newValue] }),
		}) || { ...property, value: Array.isArray(newValue) ? newValue : [newValue] },
	];
};

const updateExistingProperty = (
	updatedProperties: Property[] | PropertyValue[],
	existedPropertyIndex: number,
	newValue: string,
	isMany: boolean,
	value: string,
	propertyName: string,
	catalogProperties: Map<string, Property>,
	properties: Property[] | PropertyValue[],
): Property[] | PropertyValue[] => {
	if (isMany) {
		if (!updatedProperties[existedPropertyIndex].value.includes(value))
			updatedProperties[existedPropertyIndex].value.push(value);
		else {
			updatedProperties[existedPropertyIndex].value = updatedProperties[existedPropertyIndex].value.filter(
				(v) => v !== value,
			);

			if (updatedProperties[existedPropertyIndex].value.length === 0)
				return deleteProperty(propertyName, properties);
		}
	} else {
		updatedProperties[existedPropertyIndex] = {
			...updatedProperties[existedPropertyIndex],
			...(newValue !== null && { value: Array.isArray(newValue) ? newValue : [newValue] }),
		};
	}
	return updatedProperties;
};

const updateProperty = (
	propertyName: string,
	value: string,
	catalogProperties: Map<string, Property>,
	properties: Property[] | PropertyValue[],
	returnFull?: boolean,
) => {
	const property = catalogProperties.get(propertyName);
	if (!property || (isHasValue[property.type] && value === undefined)) return;

	const isMany = isManyProperty[property.type];
	const existedPropertyIndex = properties.findIndex((prop) => prop.name === property.name);

	const newValue = getNewValue(property, value);

	if (existedPropertyIndex === -1) {
		return sortMapByName(
			Array.from(catalogProperties.keys()),
			addOrUpdateProperty(properties, property, newValue, returnFull) as Property[],
		);
	} else {
		const updatedProperties = returnFull
			? [...properties]
			: properties.map((prop) => ({ name: prop.name, value: prop.value }));

		const newProperties = updateExistingProperty(
			updatedProperties,
			existedPropertyIndex,
			newValue,
			isMany,
			value,
			propertyName,
			catalogProperties,
			properties,
		);

		return sortMapByName(Array.from(catalogProperties.keys()), newProperties as Property[]);
	}
};

export { deleteProperty, updateProperty };
