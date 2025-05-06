import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG } from "@ext/pdfExport/config";
import { NodeOptions, parseNodeToPDFContent, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { extractContent } from "@ext/pdfExport/utils/extractTextForCases";
import { isTag } from "@ext/pdfExport/utils/isTag";
import { Content, ContentStack } from "pdfmake/interfaces";
import { JSONContent } from "@tiptap/core";

export const listItemHandler = async (
	node: Tag | JSONContent,
	context: pdfRenderContext,
	options: NodeOptions,
	isFirstItem: boolean,
): Promise<ContentStack> => {
	const marginTop = isFirstItem ? 0 : BASE_CONFIG.FONT_SIZE * 0.375;
	const stackContent: Content[] = [];
	const level = options?.level || 0;
	const parentChildren = "children" in node ? node.children || [] : node.content || [];

	if (Array.isArray(parentChildren) && parentChildren.length > 0) {
		const firstItem = parentChildren[0];

		if (
			firstItem === null ||
			typeof firstItem === "string" ||
			(isTag(firstItem) && firstItem.name !== "p") ||
			(typeof firstItem === "object" && "type" in firstItem && firstItem.type !== "tag")
		) {
			const textContent = await extractContent(node, context);

			const cleanedTextContent = textContent.map((item) => {
				const { ...rest } = item;
				return rest;
			});

			stackContent.push({
				text: [{ text: cleanedTextContent }],
				lineHeight: BASE_CONFIG.LINE_HEIGHT,
			});
		} else if (
			isTag(firstItem) ||
			(typeof firstItem === "object" && "type" in firstItem && firstItem.type === "tag")
		) {
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
