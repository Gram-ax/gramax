import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { COLOR_CONFIG } from "@ext/pdfExport/config";
import { ContentText } from "pdfmake/interfaces";

export const termHandler = (node: Tag): ContentText[] => {
	const tagName = node.attributes.title;
	const tagUrl = node.attributes.url;

	return [
		{
			text: tagName,
			link: tagUrl,
			color: tagUrl ? COLOR_CONFIG.link : undefined,
		},
	];
};
