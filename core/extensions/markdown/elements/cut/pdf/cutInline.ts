import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG } from "@ext/pdfExport/config";
import { ContentText } from "pdfmake/interfaces";
import { parseInlineContent } from "@ext/pdfExport/utils/parseInlineContent";

export const cutInlineHandler = async (node: Tag): Promise<ContentText[]> => {
	const contentPromises = parseInlineContent(node);

	const resolvedContent = await Promise.all(contentPromises);

	return resolvedContent.flat().map((item) => ({
		...item,
		lineHeight: 1,
		fontSize: BASE_CONFIG.FONT_SIZE * 0.725,
	}));
};
