import type { PropertyValue } from "@ext/properties/models";

export interface CatalogViewOptions {
	docportalVisible?: boolean;
	temp?: boolean;
}

export interface CatalogView {
	id: string;
	name: string;
	filters: PropertyValue[];
	properties: PropertyValue[];
	options?: CatalogViewOptions;
}

export type CatalogViewSection = {
	view?: CatalogView;
};

export type AppliedCatalogsView = { [catalogName: string]: string };
