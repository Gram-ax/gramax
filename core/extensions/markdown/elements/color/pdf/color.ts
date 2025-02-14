import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { COLOR_CONFIG } from "@ext/pdfExport/config";
import { parseInlineContent } from "@ext/pdfExport/utils/parseInlineContent";
import { ContentText } from "pdfmake/interfaces";

export const colorHandler = async (node: Tag): Promise<ContentText[]> => {
	const contentPromises = parseInlineContent(node);

	const resolvedContent = await Promise.all(contentPromises);
	const color = node.attributes?.color || COLOR_CONFIG.black;

	return resolvedContent.flat().map((item) => ({
		...item,
		color,
	}));
};
