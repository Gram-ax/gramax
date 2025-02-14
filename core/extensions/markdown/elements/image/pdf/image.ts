import { ContentStack, ContentTable } from "pdfmake/interfaces";
import { BASE_CONFIG, FONT_SIZE_COEFFICIENT, MAX_WIDTH, NOT_FOUND_IMAGE } from "@ext/pdfExport/config";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { NodeOptions } from "@ext/pdfExport/parseNodesPDF";
import { errorCase } from "@ext/pdfExport/utils/getErrorElement";

export function imageHandler(node: Tag, level: number, options?: NodeOptions): ContentStack | ContentTable {
	if (!node.attributes || !node.attributes.src || node.attributes.src === "") {
		return errorCase(node);
	}

	if (node.attributes.src.startsWith(NOT_FOUND_IMAGE)) {
		return errorCase(node);
	}

	let originalWidth = parseInt(node.attributes.width) || MAX_WIDTH;

	if (options?.colWidth) {
		originalWidth = Math.min(originalWidth, options?.colWidth * 0.7);
	} else if (originalWidth > MAX_WIDTH) {
		originalWidth = MAX_WIDTH;
	}

	return {
		stack: [
			{
				image: node.attributes.src,
				width: originalWidth,
				margin: [0, 0, 0, BASE_CONFIG.FONT_SIZE * 0.5],
			},
			{
				text: node.attributes.title || "",
				margin: [0, -BASE_CONFIG.FONT_SIZE * 0.25, 0, BASE_CONFIG.FONT_SIZE * 0.5],
				fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
				italics: true,
			},
		],
		alignment: "center",
	};
}
