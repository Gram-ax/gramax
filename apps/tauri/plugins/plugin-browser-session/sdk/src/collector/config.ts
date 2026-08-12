export interface CollectorConfig {
	maxNameLength: number;
	maxTextLength: number;
	maxTreeLength: number;
	viewportMargin: number;
	skippedTags: ReadonlySet<string>;
	headingTags: ReadonlySet<string>;
	interactiveRoles: ReadonlySet<string>;
	structuralRoles: ReadonlySet<string>;
}

export const defaultCollectorConfig: CollectorConfig = {
	maxNameLength: 200,
	maxTextLength: 1000,
	maxTreeLength: 150000,
	viewportMargin: 3500,
	skippedTags: new Set(["script", "style", "noscript", "template", "svg", "path", "meta", "link"]),
	headingTags: new Set(["h1", "h2", "h3", "h4", "h5", "h6"]),
	interactiveRoles: new Set([
		"button",
		"link",
		"menuitem",
		"option",
		"radio",
		"checkbox",
		"tab",
		"textbox",
		"combobox",
		"slider",
		"spinbutton",
		"listbox",
		"searchbox",
		"switch",
		"treeitem",
		"gridcell",
	]),
	structuralRoles: new Set([
		"navigation",
		"main",
		"form",
		"list",
		"listitem",
		"table",
		"row",
		"cell",
		"banner",
		"contentinfo",
		"complementary",
		"search",
		"group",
	]),
};
