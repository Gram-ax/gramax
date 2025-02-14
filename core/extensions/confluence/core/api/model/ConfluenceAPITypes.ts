export type ConfluenceInstance = {
	name: string;
	url: string;
	id: string;
};

export type Space = {
	name: string;
	id: string;
	key: string;
};

export type UserLink = {
	name: string;
	link: string;
};

export type SpaceData = {
	space: Space;
	title: string;
	excerpt: string;
	url: string;
	resultGlobalContainer: ResultGlobalContainer;
	entityType: string;
	iconCssClass: string;
	lastModified: string;
	friendlyLastModified: string;
	timestamp: number;
};

type ResultGlobalContainer = {
	title: string;
	displayUrl: string;
};
