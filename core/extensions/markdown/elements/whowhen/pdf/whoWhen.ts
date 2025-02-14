import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG, COLOR_CONFIG } from "@ext/pdfExport/config";
import { ContentText } from "pdfmake/interfaces";

export const whoHandler = (node: Tag): ContentText[] => {
	const text = node.attributes.text || "";

	return [
		{
			text: "/",
			color: COLOR_CONFIG.who,
			fontSize: BASE_CONFIG.FONT_SIZE,
		},
		{
			text: `    ${text}   `,
			fontSize: BASE_CONFIG.FONT_SIZE * 0.725,
		},
	];
};
