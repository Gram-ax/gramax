import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { parseInlineContent } from "@ext/pdfExport/utils/parseInlineContent";
import { ContentText } from "pdfmake/interfaces";

export const emHandler = async (node: Tag): Promise<ContentText[]> => {
	const contentPromises = parseInlineContent(node);

	const resolvedContent = await Promise.all(contentPromises);

	return resolvedContent.flat().map((item) => ({
		...item,
		italics: true,
	}));
};
