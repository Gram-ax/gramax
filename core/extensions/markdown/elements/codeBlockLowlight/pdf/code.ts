import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG, COLOR_CONFIG, FONT_SIZE_COEFFICIENT, MAX_WIDTH } from "@ext/pdfExport/config";
import { ContentTable, TableCell } from "pdfmake/interfaces";

const OUTER = BASE_CONFIG.FONT_SIZE * 1.25;
const INNER = OUTER;

const cellWidth = MAX_WIDTH - 2 * OUTER;

const codeBlockLayout = {
	hLineWidth: () => 0,
	vLineWidth: () => 0,

	paddingLeft: () => INNER,
	paddingRight: () => INNER,

	paddingTop: (rowIdx: number) => (rowIdx === 0 ? INNER : 0),
	paddingBottom: (rowIdx: number, node: any) =>
		rowIdx === node.table.body.length - 1 ? INNER - BASE_CONFIG.LINE_HEIGHT_MARGIN : 0,

	fillColor: () => COLOR_CONFIG.codeBlock.fillColor,
} as const;

export function codeBlockHandler(node: Tag): ContentTable {
	const raw = (node.attributes.value ?? "").replace(/\r\n/g, "\n");
	const lines = raw.split("\n");

	const body: TableCell[][] = lines.map((l) => [
		{
			text: l === "" ? " " : l, // to avoid collapsing
			fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
			lineHeight: 1.2,
			font: "Menlo",
			color: COLOR_CONFIG.codeBlock.textColor,
			preserveLeadingSpaces: true,
		},
	]);

	return {
		table: {
			widths: [cellWidth],
			body,
		},
		layout: codeBlockLayout,
	};
}
