import { parseTable } from "@ext/markdown/elements/table/pdf/utils/parseTable";
import { TableBody } from "./types";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG, COLOR_CONFIG } from "@ext/pdfExport/config";
import { ContentTable } from "pdfmake/interfaces";
import { isTag } from "@ext/pdfExport/utils/isTag";

export async function tableCase(node: Tag): Promise<ContentTable> {
	const content = node.children || [];
	const thead = content.find((row) => isTag(row) && row.name === "thead") as Tag | undefined;
	const tbody = content.find((row) => isTag(row) && row.name === "tbody") as Tag | undefined;

	let body: TableBody = [];
	let widths: (number | string)[] = [];

	if (thead && tbody) {
		const theadRows = await parseTable((thead.children as Tag[]) || []);
		const tbodyRows = await parseTable((tbody.children as Tag[]) || []);
		body = [...theadRows.body, ...tbodyRows.body];
		widths = [...theadRows.widths];
	} else if (tbody) {
		const { body: tbodyRows, widths: tbodyWidths } = await parseTable((tbody.children as Tag[]) || []);
		body = tbodyRows;
		widths = tbodyWidths;
	} else {
		const { body: rowsBody, widths: rowsWidths } = await parseTable(content as Tag[]);
		body = rowsBody;
		widths = rowsWidths;
	}

	const maxColumns = Math.max(...body.map((row) => row.length));
	const normalizedBody = body.map((row) => {
		while (row.length < maxColumns) {
			row.push({
				text: " ",
				margin: [
					BASE_CONFIG.FONT_SIZE * 0.375,
					BASE_CONFIG.FONT_SIZE * 0.375,
					BASE_CONFIG.FONT_SIZE * 0.375,
					BASE_CONFIG.FONT_SIZE * 0.0625,
				],
			});
		}
		return row;
	});

	const normalizedWidths =
		widths.length < maxColumns ? [...widths, ...Array(maxColumns - widths.length).fill("auto")] : widths;

	return {
		table: {
			dontBreakRows: true,
			body: normalizedBody,
			widths: normalizedWidths,
		},
		layout: {
			hLineWidth: (rowIndex, _node) =>
				rowIndex === 0 || (_node.table.body && rowIndex === _node.table.body.length) ? 0 : 0.1,
			vLineWidth: (colIndex, _node) =>
				colIndex === 0 || (_node.table.widths && colIndex === _node.table.widths.length) ? 0 : 0.1,
			hLineColor: () => COLOR_CONFIG.table,
			vLineColor: () => COLOR_CONFIG.table,
			paddingLeft: () => 4,
			paddingRight: () => 4,
			paddingTop: () => 8,
			paddingBottom: () => 8,
		},
	};
}
