import { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG } from "@ext/pdfExport/config";
import { inlineLayouts } from "@ext/pdfExport/layouts";
import { pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { isTag } from "@ext/pdfExport/utils/isTag";
import { JSONContent } from "@tiptap/core";
import { ContentText } from "pdfmake/interfaces";

export const extractContent = async (
	node: RenderableTreeNode | JSONContent,
	context: pdfRenderContext,
): Promise<ContentText[]> => {
	if (typeof node === "string") {
		return [
			{
				text: node,
				preserveLeadingSpaces: true,
				fontSize: BASE_CONFIG.FONT_SIZE * 0.75,
			},
		];
	}

	if (isTag(node) || "type" in node) {
		const tagName = "type" in node ? node.type : node.name;

		if (inlineLayouts[tagName]) {
			return inlineLayouts[tagName](node, context);
		}

		const children = "children" in node ? node.children : node.content;

		if (children && children.length > 0) {
			const childrenContent = await Promise.all(children.map((child) => extractContent(child, context)));

			return childrenContent.flat();
		}

		return [];
	}
};
