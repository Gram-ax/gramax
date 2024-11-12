import Style from "@components/HomePage/Cards/model/Style";

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

export interface PropItem {
	id: string;
}

export enum PropertyTypes {
	numeric = "Numeric",
	flag = "Flag",
	enum = "Enum",
}

export const getInputType: Partial<{
	[type in PropertyTypes]: string;
}> = {
	[PropertyTypes.numeric]: "number",
};

export const isHasValue: Partial<{ [type in PropertyTypes]: boolean }> = {
	[PropertyTypes.numeric]: true,
	[PropertyTypes.enum]: true,
};
