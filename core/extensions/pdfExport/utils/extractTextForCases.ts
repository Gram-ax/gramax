import { ContentText } from "pdfmake/interfaces";
import { inlineLayouts } from "@ext/pdfExport/layouts";
import { BASE_CONFIG } from "@ext/pdfExport/config";
import { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";

export const extractContent = async (node: RenderableTreeNode, headingLevel?: number): Promise<ContentText[]> => {
	if (typeof node === "string") {
		return [
			{
				text: node,
				preserveLeadingSpaces: true,
				fontSize: BASE_CONFIG.FONT_SIZE * 0.75,
			},
		];
	}

	if (node.$$mdtype === "Tag") {
		const tagName = node.name;

		if (inlineLayouts[tagName]) {
			return inlineLayouts[tagName](node, headingLevel);
		}

		if (node.children && node.children.length > 0) {
			const childrenContent = await Promise.all(
				node.children.map((child) => extractContent(child, headingLevel)),
			);

			return childrenContent.flat();
		}
	}

	return [];
};
