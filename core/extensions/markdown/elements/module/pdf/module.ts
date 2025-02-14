import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG } from "@ext/pdfExport/config";
import { ContentText } from "pdfmake/interfaces";

export const moduleHandler = (node: Tag): ContentText[] => {
	const moduleText = node.attributes.id;

	return [
		{
			text: moduleText,
			fontSize: BASE_CONFIG.FONT_SIZE * 0.5,
			bold: true,
			lineHeight: 1,
		},
	];
};
