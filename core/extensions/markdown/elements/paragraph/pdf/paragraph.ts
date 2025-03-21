import { Content } from "pdfmake/interfaces";
import { extractContent } from "@ext/pdfExport/utils/extractTextForCases";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { ZERO_WIDTH_SPACE } from "@ext/pdfExport/config";

export async function paragraphCase(node: Tag, context: pdfRenderContext): Promise<Content[]> {
	const contentPromises = (node.children || []).map(async (item) => {
		return extractContent(item, context);
	});

	const resolvedContent = await Promise.all(contentPromises);
	const filteredContent = resolvedContent.filter(Boolean);
	const flatContent = filteredContent.flat();

	const textContent = flatContent.map((item) => {
		const contentText: Content = { text: item.text || "", lineHeight: 1.35 };
		return Object.assign(contentText, item);
	});

	if (textContent.length === 0) return [{ text: ZERO_WIDTH_SPACE }];

	return [
		{
			text: textContent,
		},
	];
}
