import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { parseTable } from "@ext/markdown/elements/table/pdf/utils/parseTable";
import { BASE_CONFIG, TABLE_STYLE } from "@ext/pdfExport/config";
import { NodeOptions, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { isTag } from "@ext/pdfExport/utils/isTag";
import { JSONContent } from "@tiptap/core";
import { ContentTable } from "pdfmake/interfaces";
import { TableBody } from "./types";

export async function tableCase(
	table: Tag | JSONContent,
	context: pdfRenderContext,
	options: NodeOptions,
): Promise<ContentTable> {
	const node = JSON.parse(JSON.stringify(table));
	const content = ("children" in node ? node.children : node.content) || [];

	const thead = content.find(
		(row) =>
			(isTag(row) && row.name === "thead") || (typeof row === "object" && "type" in row && row.type === "thead"),
	);
	const tbody = content.find(
		(row) =>
			(isTag(row) && row.name === "tbody") || (typeof row === "object" && "type" in row && row.type === "tbody"),
	);

	let body: TableBody = [];
	let widths: (number | string)[] = [];

	if (thead && tbody) {
		const theadChildren = "children" in thead ? thead.children : thead.content;
		const tbodyChildren = "children" in tbody ? tbody.children : tbody.content;

		const theadRows = await parseTable(theadChildren as Tag[], context, options);
		const tbodyRows = await parseTable(tbodyChildren as Tag[], context, options);
		body = [...theadRows.body, ...tbodyRows.body];
		widths = [...theadRows.widths];
	} else if (tbody) {
		const tbodyChildren = "children" in tbody ? tbody.children : tbody.content;
		const { body: tbodyRows, widths: tbodyWidths } = await parseTable(tbodyChildren, context, options);
		body = tbodyRows;
		widths = tbodyWidths;
	} else {
		const { body: rowsBody, widths: rowsWidths } = await parseTable(content as Tag[], context, options);
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
		layout: TABLE_STYLE,
	};
}
