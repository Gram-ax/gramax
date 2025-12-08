export type ListLevelIndent = {
	left?: string | null;
	hanging?: string | null;
	firstLine?: string | null;
};

export type TemplateStylesInfo = {
	mapping: Map<string, string>;
	paragraphIndents: Map<string, ListLevelIndent>;
};
