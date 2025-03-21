import { parseTable } from "@ext/markdown/elements/table/pdf/utils/parseTable";
import { TableBody } from "./types";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG, TABLE_STYLE } from "@ext/pdfExport/config";
import { ContentTable } from "pdfmake/interfaces";
import { isTag } from "@ext/pdfExport/utils/isTag";
import { NodeOptions, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";

export async function tableCase(node: Tag, context: pdfRenderContext, options: NodeOptions): Promise<ContentTable> {
	const content = node.children || [];
	const thead = content.find((row) => isTag(row) && row.name === "thead") as Tag | undefined;
	const tbody = content.find((row) => isTag(row) && row.name === "tbody") as Tag | undefined;

	let body: TableBody = [];
	let widths: (number | string)[] = [];

	if (thead && tbody) {
		const theadRows = await parseTable((thead.children as Tag[]) || [], context, options);
		const tbodyRows = await parseTable((tbody.children as Tag[]) || [], context, options);
		body = [...theadRows.body, ...tbodyRows.body];
		widths = [...theadRows.widths];
	} else if (tbody) {
		const { body: tbodyRows, widths: tbodyWidths } = await parseTable(
			(tbody.children as Tag[]) || [],
			context,
			options,
		);
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
