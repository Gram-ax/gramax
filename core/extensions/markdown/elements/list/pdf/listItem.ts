import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG } from "@ext/pdfExport/config";
import { parseNodeToPDFContent } from "@ext/pdfExport/parseNodesPDF";
import { isTag } from "@ext/pdfExport/utils/isTag";
import { Content, ContentStack } from "pdfmake/interfaces";

export const listItemHandler = async (node: Tag, level: number, isFirstItem: boolean): Promise<ContentStack> => {
	const marginTop = isFirstItem ? 0 : BASE_CONFIG.FONT_SIZE * 0.375;
	const stackContent: Content[] = [];

	if (Array.isArray(node.children)) {
		const firstItem = node.children[0];

		if (typeof firstItem === "string") {
			stackContent.push({
				text: firstItem,
			});
		} else if (isTag(firstItem)) {
			const nestedLists = await parseNodeToPDFContent(node, level);
			stackContent.push(...nestedLists);
		}
	}

	return {
		stack: stackContent,
		margin: [BASE_CONFIG.FONT_SIZE * 0.125 * level, marginTop, 0, 0],
	};
};
