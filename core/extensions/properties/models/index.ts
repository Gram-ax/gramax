import Input from "@components/Atoms/Input";
import Style from "@components/HomePage/Cards/model/Style";
import { ComponentType } from "react";

type PropertyID = string;

export enum SystemProperties {
	hierarchy = "hierarchy",
}

export interface Property {
	name: PropertyID;
	type: PropertyTypes;
	style: Style;
	icon?: string;
	values?: string[];
	value?: string[];
}

export interface PropertyValue {
	name: PropertyID;
	value?: string[];
}

export interface ViewRenderData {
	title: string;
	linkPath: string;
	itemPath: string;
	resourcePath: string;
	otherProps: Property[];
}

export interface ViewRenderGroup {
	group: string[];
	articles: ViewRenderData[];
	subgroups?: ViewRenderGroup[];
}

export enum PropertyTypes {
	numeric = "Numeric",
	flag = "Flag",
	enum = "Enum",
	date = "Date",
	many = "Many",
	text = "Text",
}

export const getInputComponent: Partial<{
	[type in PropertyTypes]: ComponentType<any>;
}> = {
	[PropertyTypes.numeric]: Input,
	[PropertyTypes.date]: Input,
	[PropertyTypes.text]: Input,
};

export const getInputType: Partial<{ [type in PropertyTypes]: string }> = {
	[PropertyTypes.numeric]: "number",
	[PropertyTypes.date]: "date",
	[PropertyTypes.text]: "text",
};

export const getPlaceholder = {
	[PropertyTypes.numeric]: "enter-number",
	[PropertyTypes.text]: "enter-text",
};

export const isManyProperty: Partial<{ [type in PropertyTypes]: boolean }> = {
	[PropertyTypes.many]: true,
};

export const isHasValue: Partial<{ [type in PropertyTypes]: boolean }> = {
	[PropertyTypes.numeric]: true,
	[PropertyTypes.enum]: true,
	[PropertyTypes.many]: true,
	[PropertyTypes.date]: true,
	[PropertyTypes.text]: true,
};

export interface PropertyUsage {
	title: string;
	resourcePath: string;
	linkPath: string;
}
