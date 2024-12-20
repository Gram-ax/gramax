import { NotionBlock } from "@ext/notion/model/NotionTypes";

export const databaseView = (description: NotionBlock[], selected: string[]) => {
	return [
		{ type: "paragraph", paragraph: { rich_text: description } },
		{
			type: "view",
			attrs: {
				defs: [{ name: "hierarchy", value: ["none"] }],
				select: selected,
				display: "Table",
			},
		},
	];
};
