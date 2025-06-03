import { Property, PropertyTypes } from "@ext/properties/models";

export type TemplateProperties = Property[];

export type PropertyChild = Array<PropertyTypes>;

export type TemplateCustomProperty = Property & {
	child?: PropertyChild;
};

export type TemplateField = {
	name: string;
	value: string;
};
