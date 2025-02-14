import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG, COLOR_CONFIG, FONT_SIZE_COEFFICIENT } from "@ext/pdfExport/config";
import { ContentText } from "pdfmake/interfaces";

export const kbdHandler = (node: Tag): ContentText[] => {
	const kbdText = node.attributes.text;

	return [
		{
			text: kbdText,
			fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
			color: COLOR_CONFIG.codeBlock.textColor,
			background: COLOR_CONFIG.codeBlock.fillColor,
			lineHeight: BASE_CONFIG.LINE_HEIGHT,
		},
	];
};
