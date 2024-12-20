import Path from "@core/FileProvider/Path/Path";

export type PageNode = {
	id: string;
	title: string;
	url: string;
	type: "page" | "database";
	properties: { [key: string]: NotionProperty };
	description: NotionBlock[];
	last_edited_time: string;
	content: NotionBlock[];
	children: PageNode[];
	parent_id?: string;
};

export type NotionPage = {
	id: string;
	object: "page" | "database";
	title: { plain_text: string }[] | { plain_text: string };
	url: string;
	properties: { [key: string]: NotionProperty };
	description: NotionBlock[];
	last_edited_time: string;
	parent: {
		type: "page_id" | "database_id" | "block_id";
		page_id?: string;
		database_id?: string;
		block_id?: string;
	};
};

export type NotionProperty = {
	id: string;
	name: string;
	type: NotionPropertyTypes;
	value?: any;
	title?: Array<{ plain_text: string }>;
	options?: {
		id: string;
		name: string;
		color?: string;
		description?: string;
	}[];
};

export type NotionBlock = {
	object: "block";
	id: string;
	parent: {
		type: "page_id" | "database_id" | "block_id";
		page_id?: string;
		database_id?: string;
		block_id?: string;
	};
	has_children: boolean;
	type: string;
	[key: string]: any;
	content?: NotionBlock[];
};

export type CollectedProperty = {
	key: string;
	value: NotionProperty;
	articleTitle: string;
};

export enum NotionPropertyTypes {
	Checkbox = "checkbox",
	CreatedBy = "created_by",
	CreatedTime = "created_time",
	Date = "date",
	Email = "email",
	Formula = "formula",
	Files = "files",
	LastEditedBy = "last_edited_by",
	LastEditedTime = "last_edited_time",
	Number = "number",
	PhoneNumber = "phone_number",
	RichText = "rich_text",
	Title = "title",
	URL = "url",
	UniqueID = "unique_id",
	Relation = "relation",
	Rollup = "rollup",
	MultiSelect = "multi_select",
	People = "people",
	Select = "select",
	Status = "status",
}

export type PathsMapValue = {
	title: string;
	pagePath: Path;
};
