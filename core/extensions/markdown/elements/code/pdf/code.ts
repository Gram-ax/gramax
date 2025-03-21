import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG, FONT_SIZE_COEFFICIENT } from "@ext/pdfExport/config";
import { ContentText } from "pdfmake/interfaces";
import { parseInlineContent } from "@ext/pdfExport/utils/parseInlineContent";

export const codeHandler = async (node: Tag): Promise<ContentText[]> => {
	const contentPromises = parseInlineContent(node);

	const resolvedContent = await Promise.all(contentPromises);

	return resolvedContent.flat().map((item) => ({
		...item,
		margin: [0, BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT, 0, BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT],
		style: "CODE",
		lineHeight: BASE_CONFIG.LINE_HEIGHT,
		fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
	}));
};
