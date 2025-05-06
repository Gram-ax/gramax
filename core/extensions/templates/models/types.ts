import { ClientItemRef } from "@core/SitePresenter/SitePresenter";
import { Property } from "@ext/properties/models";

export type TemplateProperties = Property[];

export type TemplateID = string;

export type TemplateProps = {
	id: TemplateID;
	title: string;
	logicPath: string;
	ref: ClientItemRef;
};

export type TemplateItemProps = {
	id: TemplateID;
	title: string;
};
