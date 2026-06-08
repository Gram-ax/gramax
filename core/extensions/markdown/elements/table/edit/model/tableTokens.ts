import type { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";

const safeJsonParse = (jsonString: string) => {
	try {
		return JSON.parse(jsonString);
	} catch {
		return;
	}
};

const table: ParseSpec = {
	block: "table",
	getAttrs: ({ attrs }) => {
		if (attrs?.sortingOrder) attrs.sortingOrder = (attrs.sortingOrder as string).split(",");
		return attrs;
	},
};

const tableRow: ParseSpec = { block: "tableRow", getAttrs: (tok) => tok.attrs };

const tableCell: ParseSpec = {
	block: "tableCell",
	getAttrs: ({ attrs }) => {
		attrs && !attrs.colspan && delete attrs.colspan;
		attrs && !attrs.rowspan && delete attrs.rowspan;

		if (attrs?.filter) attrs.filter = safeJsonParse(attrs.filter as string);
		return attrs;
	},
};

export default { table, tableRow, tableCell };
