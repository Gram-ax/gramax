// import { CliPrettify } from "markdown-table-prettify";  "markdown-table-prettify": "^3.6.0",
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { Node } from "prosemirror-model";
import { ProsemirrorMarkdownSerializer, getSchema } from "../../Prosemirror";
import getMarkFormatters from "../Formatters/getMarkFormatters";
import getNodeFormatters from "../Formatters/getNodeFormatters";

const TableUtils = {
	async getSimpleTable(node: Node, delim: string, context: ParserContext): Promise<string> {
		const table = node.toJSON();
		table.type = "table_simple";
		for (let rowIdx = 0; rowIdx < table.content.length; rowIdx++) {
			const row = table.content[rowIdx];
			if (rowIdx == 0) row.type = "tableHeaderRow_simple";
			else row.type = "tableBodyRow_simple";
			for (let cellIdx = 0; cellIdx < row.content.length; cellIdx++) {
				const cell = row.content[cellIdx];
				if (rowIdx == 0) cell.type = "tableHeader_simple";
				else cell.type = "tableCell_simple";
				cell.content = cell.content[0].content;
			}
		}
		return TableUtils.prettifySimpleTable(
			await new ProsemirrorMarkdownSerializer(getNodeFormatters(context), getMarkFormatters(context)).serialize(
				Node.fromJSON(getSchema(), { type: "doc", content: [table] }),
				{},
				delim,
			),
		);
	},
	prettifySimpleTable(SimpleTable: string): string {
		return SimpleTable; // return CliPrettify.prettify(SimpleTable);
	},
	tableIsSimple(node: Node): boolean {
		if (node.childCount <= 1) return false;
		let tableIsSimple = true;
		node.forEach((n, offset, idx) => {
			if (tableIsSimple && idx == 0 && !TableUtils.rowIsHeader(n)) tableIsSimple = false;
			if (tableIsSimple && !TableUtils.rowIsSimple(n, idx)) tableIsSimple = false;
		});
		return tableIsSimple;
	},
	rowIsHeader(node: Node): boolean {
		let rowIsHeader = true;
		node.forEach((n) => {
			if (rowIsHeader && n.type.name !== "tableHeader") rowIsHeader = false;
		});
		return rowIsHeader;
	},
	rowIsSimple(node: Node, idx: number): boolean {
		let rowIsSimple = true;
		node.forEach((n) => {
			if (rowIsSimple && !TableUtils.cellIsSimple(n, idx)) rowIsSimple = false;
		});
		return rowIsSimple;
	},
	cellIncludeHardBreak(childContent: Node) {
		let hasHardBreak = false;
		childContent.forEach((node) => {
			if (node.type.name === "hard_break") {
				hasHardBreak = true;
				return false;
			}
		});
		return hasHardBreak;
	},
	cellIsSimple(node: Node, rowIdx: number): boolean {
		if (node.childCount > 1) return false;
		if (node.firstChild.type.name !== "paragraph") return false;
		if (this.cellIncludeHardBreak(node.content.firstChild)) return false;
		if (rowIdx !== 0 && node.type.name === "tableHeader") return false;
		if (JSON.stringify(node.attrs) !== `{"colspan":1,"rowspan":1,"colwidth":null}`) return false;
		let cellIsSimple = true;
		node.firstChild.forEach((n) => {
			if (cellIsSimple && !n.isInline) cellIsSimple = false;
		});
		return cellIsSimple;
	},
	getTableAttributes(attrs: { [name: string]: any }): string {
		if (attrs.colspan == 1) attrs.colspan = null;
		if (attrs.rowspan == 1) attrs.rowspan = null;
		const attributes = Object.keys(attrs)
			.map((key) => (attrs[key] ? `${key}=${Array.isArray(attrs[key]) ? `[${attrs[key]}]` : attrs[key]}` : null))
			.filter((a) => a);
		if (attributes.length == 0) return "";
		return `{% ${attributes.join(" ")} %}\n\n`;
	},
};

export default TableUtils;
