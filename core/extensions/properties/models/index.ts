import Style from "@components/HomePage/Cards/model/Style";

type PropertyID = string;

export interface Property {
	id: PropertyID;
	name: string;
	type: PropertyTypes;
	style: Style;
	values?: string[];
	value?: string | number;
}

export interface PropertyValue {
	id: PropertyID;
	value?: string | number;
}

export enum PropertyTypes {
	counter = "Counter",
	"counter-link" = "Counter-link",
	flag = "Flag",
	enum = "Enum",
}
