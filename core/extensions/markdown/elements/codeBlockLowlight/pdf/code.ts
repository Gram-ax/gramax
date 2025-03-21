import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG, COLOR_CONFIG, FONT_SIZE_COEFFICIENT, MAX_WIDTH } from "@ext/pdfExport/config";
import { ContentTable } from "pdfmake/interfaces";

export function codeBlockHandler(node: Tag): ContentTable {
	return {
		table: {
			dontBreakRows: true,
			widths: [MAX_WIDTH],
			body: [
				[
					{
						text: node.attributes.value,
						fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
						fillColor: COLOR_CONFIG.codeBlock.fillColor,
						margin: [
							BASE_CONFIG.FONT_SIZE * 1.25,
							BASE_CONFIG.FONT_SIZE * 1.25,
							BASE_CONFIG.FONT_SIZE * 1.25,
							BASE_CONFIG.FONT_SIZE * 1.25 - BASE_CONFIG.LINE_HEIGHT_MARGIN,
						],
						lineHeight: 1.2,
						font: "Menlo",
						color: COLOR_CONFIG.codeBlock.textColor,
						preserveLeadingSpaces: true,
					},
				],
			],
		},
		layout: "noBorders",
	};
}
