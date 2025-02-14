import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { COLOR_CONFIG } from "@ext/pdfExport/config";
import { parseInlineContent } from "@ext/pdfExport/utils/parseInlineContent";
import { ContentText } from "pdfmake/interfaces";

export const linkHandler = async (node: Tag): Promise<ContentText[]> => {
	const contentPromises = parseInlineContent(node);

	const resolvedContent = await Promise.all(contentPromises);

	return resolvedContent.flat().map((item) => ({
		...item,
		link: node.attributes?.href || "",
		color: COLOR_CONFIG.link,
	}));
};
