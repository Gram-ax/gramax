import { ContentText } from "pdfmake/interfaces";
import { inlineLayouts } from "@ext/pdfExport/layouts";
import { BASE_CONFIG } from "@ext/pdfExport/config";
import { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";
import { pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { isTag } from "@ext/pdfExport/utils/isTag";

export const extractContent = async (node: RenderableTreeNode, context: pdfRenderContext): Promise<ContentText[]> => {
	if (typeof node === "string") {
		return [
			{
				text: node,
				preserveLeadingSpaces: true,
				fontSize: BASE_CONFIG.FONT_SIZE * 0.75,
			},
		];
	}

	if (isTag(node)) {
		const tagName = node.name;

		if (inlineLayouts[tagName]) {
			return inlineLayouts[tagName](node, context);
		}

		if (node.children && node.children.length > 0) {
			const childrenContent = await Promise.all(node.children.map((child) => extractContent(child, context)));

			return childrenContent.flat();
		}
	}
};
