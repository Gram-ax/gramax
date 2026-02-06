import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { ZERO_WIDTH_SPACE } from "@ext/pdfExport/config";
import { pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { extractContent } from "@ext/pdfExport/utils/extractTextForCases";
import { JSONContent } from "@tiptap/core";
import { Content } from "pdfmake/interfaces";

export async function paragraphCase(node: Tag | JSONContent, context: pdfRenderContext): Promise<Content[]> {
	const children = "children" in node ? node.children : node.content;
	const contentPromises = children.map(async (item) => {
		return extractContent(item, context);
	});

	const resolvedContent = await Promise.all(contentPromises);
	const filteredContent = resolvedContent.filter(Boolean);
	const flatContent = filteredContent.flat();

	const content: Content[] = [],
		textContent = [];

	const pushTextContent = () => {
		if (textContent.length) {
			content.push({
				text: textContent.slice(),
			});
			textContent.length = 0;
		}
	};

	flatContent.forEach((item) => {
		if (!item.text) {
			if (textContent.length) pushTextContent();
			return content.push({
				stack: [item],
			});
		}
		const contentText: Content = item.text ? { text: item.text || "", lineHeight: 1.35 } : item;
		textContent.push(Object.assign(contentText, item));
	});
	pushTextContent();

	if (content.length === 0) return [{ text: ZERO_WIDTH_SPACE }];

	return content;
}
