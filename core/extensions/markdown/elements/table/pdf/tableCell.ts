import { TableCell } from "./types";
import { parseNodeToPDFContent } from "@ext/pdfExport/parseNodesPDF";
import { BASE_CONFIG } from "@ext/pdfExport/config";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";

export const parseCell = async (
	cell: Tag,
	rowIndex: number,
	tableRow: TableCell[],
): Promise<{ cellObject: TableCell; colWidth: number | string; colIndex: number }> => {
	const isHeader = cell.name === "th";
	const colSpan = cell.attributes?.colspan || 1;
	const rowSpan = cell.attributes?.rowspan || 1;

	const colIndex = tableRow.length;
	const colWidth = calculateColWidth(cell);
	const cellContent = await parseNodeToPDFContent(cell, 0, {
		colWidth: colWidth === "auto" ? 180 : (colWidth as number),
	});

	const cellObject: TableCell = {
		stack: cellContent,
		bold: isHeader,
		margin:
			colIndex === 0
				? [0, BASE_CONFIG.FONT_SIZE * 0.375, BASE_CONFIG.FONT_SIZE * 0.375, BASE_CONFIG.FONT_SIZE * 0.0625]
				: [
						BASE_CONFIG.FONT_SIZE * 0.375,
						BASE_CONFIG.FONT_SIZE * 0.375,
						BASE_CONFIG.FONT_SIZE * 0.375,
						BASE_CONFIG.FONT_SIZE * 0.0625,
				  ],
		colSpan: colSpan > 1 ? colSpan : undefined,
		rowSpan: rowSpan > 1 ? rowSpan : undefined,
	};

	return { cellObject, colWidth, colIndex };
};

export const calculateColWidth = (cell: Tag): number | string => {
	return cell.attributes?.colwidth ? (cell.attributes.colwidth[0] / 100) * 67 : "auto";
};
