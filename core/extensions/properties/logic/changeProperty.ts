import sortMapByName from "@ext/markdown/elements/view/render/logic/sortMap";
import { getPropertyValue } from "@ext/properties/logic/getPropertyValue";
import { isHasValue, isManyProperty, type Property, PropertyTypes, type PropertyValue } from "@ext/properties/models";

const deleteProperty = (
	propertyName: string,
	properties: Property[] | PropertyValue[],
	returnFull?: boolean,
): Property[] | PropertyValue[] => {
	return properties
		.filter((prop) => prop.id !== propertyName)
		.map((prop) => (returnFull ? prop : getPropertyValue(prop as Property)));
};

const getNewValue = (property: Property, value: string): string => {
	return isHasValue[property.type] && value ? value : null;
};

const addOrUpdateProperty = (
	properties: Property[] | PropertyValue[],
	property: Property,
	newValue: string,
	returnFull: boolean,
): Property[] | PropertyValue[] => {
	const wrappedValue = Array.isArray(newValue) ? newValue : [newValue];
	const newProperty = returnFull
		? { ...property, value: wrappedValue }
		: { id: property.id, ...(newValue !== null && { value: wrappedValue }) };

	return [...(returnFull ? properties : properties.map((prop) => getPropertyValue(prop))), newProperty];
};

const isToggleProperty: Partial<{ [type in PropertyTypes]: boolean }> = {
	[PropertyTypes.flag]: true,
	[PropertyTypes.enum]: true,
};

const updateExistingProperty = (
	updatedProperties: Property[] | PropertyValue[],
	existedPropertyIndex: number,
	newValue: string,
	isMany: boolean,
	value: string,
	propertyName: string,
	properties: Property[] | PropertyValue[],
	propertyType: PropertyTypes,
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
	} else if (isToggleProperty[propertyType]) {
		const currentValue = updatedProperties[existedPropertyIndex].value;
		const currentMatch =
			newValue === null || (Array.isArray(currentValue) ? currentValue.includes(value) : currentValue === value);

		if (currentMatch) return deleteProperty(propertyName, properties);

		updatedProperties[existedPropertyIndex] = {
			...updatedProperties[existedPropertyIndex],
			value: Array.isArray(newValue) ? newValue : [newValue],
		};
	} else {
		updatedProperties[existedPropertyIndex] = {
			...updatedProperties[existedPropertyIndex],
			value: Array.isArray(newValue) ? newValue : [newValue],
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
	const existedPropertyIndex = properties.findIndex((prop) => prop.id === property.id);

	const newValue = getNewValue(property, value);

	if (existedPropertyIndex === -1) {
		const newProperties = addOrUpdateProperty(properties, property, newValue, returnFull) as Property[];
		return sortMapByName(Array.from(catalogProperties.keys()), newProperties);
	}
	const updatedProperties = returnFull ? [...properties] : properties.map((prop) => getPropertyValue(prop));

	const newProperties = updateExistingProperty(
		updatedProperties,
		existedPropertyIndex,
		newValue,
		isMany,
		value,
		propertyName,
		properties,
		property.type,
	);

	return sortMapByName(Array.from(catalogProperties.keys()), newProperties as Property[]);
};

export { deleteProperty, updateProperty };
