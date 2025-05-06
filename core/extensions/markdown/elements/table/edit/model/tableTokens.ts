import { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";

const table = { block: "table", getAttrs: (tok) => tok.attrs };

const tableRow = { block: "tableRow", getAttrs: (tok) => tok.attrs };

const col = { node: "col", getAttrs: (tok) => tok.attrs };

const colgroup = { block: "colgroup", getAttrs: (tok) => tok.attrs };

const tableCell: ParseSpec = {
	block: "tableCell",
	getAttrs: (tok) => {
		tok.attrs && !tok.attrs.colspan && delete tok.attrs.colspan;
		tok.attrs && !tok.attrs?.rowspan && delete tok.attrs.rowspan;
		return tok.attrs;
	},
};

export default { table, tableRow, tableCell, col, colgroup };
