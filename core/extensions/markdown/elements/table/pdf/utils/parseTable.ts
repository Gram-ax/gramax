import { parseRow } from "@ext/markdown/elements/table/pdf/tableRow";
import { TableBody } from "../types";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { MAX_WIDTH } from "@ext/pdfExport/config";
import { NodeOptions, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { JSONContent } from "@tiptap/core";
import { aggregateTable, setCellAlignment } from "@ext/markdown/elements/table/edit/logic/exportUtils";

export const parseTable = async (
	rows: Tag[] | JSONContent[],
	context: pdfRenderContext,
	options: NodeOptions,
): Promise<{ body: TableBody; widths: (number | string)[] }> => {
	const tableBody: TableBody = [];
	let colWidths: (number | string)[] = [];

	aggregateTable(rows);
	setCellAlignment(rows);

	for (const row of rows) {
		const { tableRow, widths } = await parseRow(row, tableBody.length, context, options);
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

	const adjustImageWidth = (node, colWidth) => {
		if (Array.isArray(node)) {
			node.forEach((item) => adjustImageWidth(item, colWidth));
		} else if (typeof node === "object" && node !== null) {
			if ("image" in node) {
				node.width = colWidth;
				node._width = colWidth;
				node._maxWidth = colWidth;

				if (node._minWidth) {
					node._minWidth = colWidth;
				}
			}

			if (node.stack && Array.isArray(node.stack)) {
				adjustImageWidth(node.stack, colWidth);
			}
		}
	};

	tableBody.forEach((row) => {
		row.forEach((cell, colIndex) => {
			const colWidth = colWidths[colIndex];

			if (cell.stack && Array.isArray(cell.stack)) {
				adjustImageWidth(cell.stack, colWidth);
			}
		});
	});

	return { body: tableBody, widths: colWidths };
};
