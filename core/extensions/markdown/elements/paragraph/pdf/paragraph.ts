import { Content } from "pdfmake/interfaces";
import { extractContent } from "@ext/pdfExport/utils/extractTextForCases";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { ZERO_WIDTH_SPACE } from "@ext/pdfExport/config";
import { JSONContent } from "@tiptap/core";

export async function paragraphCase(node: Tag | JSONContent, context: pdfRenderContext): Promise<Content[]> {
	const children = "children" in node ? node.children : node.content;
	const contentPromises = children.map(async (item) => {
		return extractContent(item, context);
	});

	const resolvedContent = await Promise.all(contentPromises);
	const filteredContent = resolvedContent.filter(Boolean);
	const flatContent = filteredContent.flat();

	const textContent = flatContent.map((item) => {
		const contentText: Content = item.text ? { text: item.text || "", lineHeight: 1.35 } : item;
		return Object.assign(contentText, item);
	});

	if (textContent.length === 0) return [{ text: ZERO_WIDTH_SPACE }];

	return [
		{
			stack: textContent,
		},
	];
}
