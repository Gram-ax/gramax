import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { parseCell } from "@ext/markdown/elements/table/pdf/tableCell";
import { NodeOptions, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { isTag } from "@ext/pdfExport/utils/isTag";
import { JSONContent } from "@tiptap/core";
import { TableRow } from "./types";

export const parseRow = async (
	row: Tag | JSONContent,
	rowIndex: number,
	context: pdfRenderContext,
	options: NodeOptions,
): Promise<{ tableRow: TableRow; widths: (number | string)[] }> => {
	const tableRow: TableRow = [];
	const widths: (number | string)[] = [];
	let currentColIndex = 0;

	for (const cell of "children" in row ? row.children : row.content || []) {
		if (!cell) continue;

		if (isTag(cell) || (typeof cell === "object" && "type" in cell && cell.type === "tag")) {
			const { cellObject, colWidth } = await parseCell(cell, rowIndex, tableRow, context, options);

			const attrs = "attributes" in cell ? cell.attributes : cell.attrs;
			const colspan = attrs?.colspan || 1;

			tableRow[currentColIndex] = cellObject;
			widths[currentColIndex] = colWidth;

			currentColIndex += colspan;
		}
	}

	return { tableRow, widths };
};
