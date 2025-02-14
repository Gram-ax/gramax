import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG, COLOR_CONFIG, FONT_SIZE_COEFFICIENT } from "@ext/pdfExport/config";
import { ContentText } from "pdfmake/interfaces";

export const cmdHandler = (node: Tag): ContentText[] => {
	const cmdText = node.attributes.text;

	return [
		{
			text: cmdText,
			italics: true,
			bold: true,
			fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
			color: COLOR_CONFIG.codeBlock.textColor,
			background: COLOR_CONFIG.codeBlock.fillColor,
			lineHeight: 1,
		},
	];
};
