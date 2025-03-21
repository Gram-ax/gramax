import { parseCell } from "@ext/markdown/elements/table/pdf/tableCell";
import { TableRow } from "./types";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { isTag } from "@ext/pdfExport/utils/isTag";
import { NodeOptions, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";

export const parseRow = async (
	row: Tag,
	rowIndex: number,
	context: pdfRenderContext,
	options: NodeOptions,
): Promise<{ tableRow: TableRow; widths: (number | string)[] }> => {
	const tableRow: TableRow = [];
	const widths: (number | string)[] = [];
	let currentColIndex = 0;

	for (const cell of row.children || []) {
		if (!cell) continue;

		if (isTag(cell)) {
			const { cellObject, colWidth } = await parseCell(cell, rowIndex, tableRow, context, options);

			const colspan = cell.attributes?.colspan || 1;

			tableRow[currentColIndex] = cellObject;
			widths[currentColIndex] = colWidth;

			currentColIndex += colspan;
		}
	}

	return { tableRow, widths };
};
