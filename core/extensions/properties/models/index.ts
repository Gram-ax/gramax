import Style from "@components/HomePage/Cards/model/Style";

export type PropertyID = string;

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
	// array = "Array",
	blockMd = "BlockMd",
	// inlineMd = "InlineMd",
}

export const isManyProperty: Partial<{ [type in PropertyTypes]: boolean }> = {
	[PropertyTypes.many]: true,
};

export const isHasValue: Partial<{ [type in PropertyTypes]: boolean }> = {
	[PropertyTypes.numeric]: true,
	[PropertyTypes.enum]: true,
	[PropertyTypes.many]: true,
	[PropertyTypes.date]: true,
	[PropertyTypes.text]: true,
	// [PropertyTypes.blockMd]: true,
	// [PropertyTypes.inlineMd]: true,
	// [PropertyTypes.array]: true,
};

export interface PropertyUsage {
	title: string;
	resourcePath: string;
	linkPath: string;
}

export const enumTypes = [PropertyTypes.enum, PropertyTypes.many];

declare module "@core/FileStructue/Item/Item" {
	interface ItemProps {
		properties?: PropertyValue[];
	}
}
