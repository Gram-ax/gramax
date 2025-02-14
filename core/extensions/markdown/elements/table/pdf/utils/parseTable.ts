import { parseRow } from "@ext/markdown/elements/table/pdf/tableRow";
import { TableBody } from "../types";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { MAX_WIDTH } from "@ext/pdfExport/config";

export const parseTable = async (rows: Tag[]): Promise<{ body: TableBody; widths: (number | string)[] }> => {
	const tableBody: TableBody = [];
	let colWidths: (number | string)[] = [];

	for (const row of rows) {
		const { tableRow, widths } = await parseRow(row, tableBody.length);
		tableBody.push(tableRow);
		widths.forEach((width, index) => {
			colWidths[index] = width;
		});
	}

	const fixedWidths = colWidths.filter((w) => typeof w === "number");
	const totalFixedWidth = fixedWidths.reduce((sum, w) => sum + w, 0);
	const autoCount = colWidths.filter((w) => w === "auto").length;
	const totalWidth = totalFixedWidth + (autoCount > 0 ? autoCount * 50 : 0);

	if (totalWidth <= MAX_WIDTH) {
		return { body: tableBody, widths: colWidths };
	}

	const availableWidth = MAX_WIDTH - colWidths.length * 8.1;
	const contractionCoefficient = availableWidth / totalWidth;

	colWidths = colWidths.map((width) => (typeof width === "number" ? width * contractionCoefficient : width));

	const usedWidth = colWidths.filter((w): w is number => typeof w === "number").reduce((sum, w) => sum + w, 0);

	const remainingSpace = availableWidth - usedWidth;

	if (remainingSpace > 0 && autoCount > 0) {
		const autoWidth = remainingSpace / autoCount;
		colWidths = colWidths.map((width) => (width === "auto" ? autoWidth : width));
	}

	return { body: tableBody, widths: colWidths };
};
