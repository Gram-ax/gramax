import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG } from "@ext/pdfExport/config";
import { NodeOptions, parseNodeToPDFContent, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { extractContent } from "@ext/pdfExport/utils/extractTextForCases";
import { isTag } from "@ext/pdfExport/utils/isTag";
import { Content, ContentStack } from "pdfmake/interfaces";

export const listItemHandler = async (
	node: Tag,
	context: pdfRenderContext,
	options: NodeOptions,
	isFirstItem: boolean,
): Promise<ContentStack> => {
	const marginTop = isFirstItem ? 0 : BASE_CONFIG.FONT_SIZE * 0.375;
	const stackContent: Content[] = [];
	const level = options?.level || 0;

	if (Array.isArray(node.children) && node.children.length > 0) {
		const firstItem = node.children[0];

		if (firstItem === null || typeof firstItem === "string" || (isTag(firstItem) && firstItem.name !== "p")) {
			const textContent = await extractContent(node, context);

			const cleanedTextContent = textContent.map((item) => {
				const { ...rest } = item;
				return rest;
			});

			stackContent.push({
				text: [{ text: cleanedTextContent }],
				lineHeight: BASE_CONFIG.LINE_HEIGHT,
			});
		} else if (isTag(firstItem)) {
			const nestedLists = await parseNodeToPDFContent(node, context, options);
			stackContent.push(...nestedLists);
		}
	}

	if (stackContent.length === 0) {
		stackContent.push({ text: "\u200B" });
	}

	return {
		stack: stackContent,
		margin: [BASE_CONFIG.FONT_SIZE * 0.125 * level, marginTop, 0, 0],
	};
};
