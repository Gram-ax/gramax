import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { parseInlineContent } from "@ext/pdfExport/utils/parseInlineContent";
import { JSONContent } from "@tiptap/core";
import { ContentText } from "pdfmake/interfaces";

export const highlightHandler = async (node: Tag | JSONContent): Promise<ContentText[]> => {
	// const attrs = "attributes" in node ? node.attributes : node.attrs;
	const contentPromises = parseInlineContent(node);
	const resolvedContent = await Promise.all(contentPromises);

	return resolvedContent.flat().map((item) => ({
		...item,
		// background: HIGHLIGHT_DOCX_NAMES[attrs.color],
	}));
};
