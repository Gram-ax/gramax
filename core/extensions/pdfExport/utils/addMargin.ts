import { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG, HEADING_MARGINS } from "@ext/pdfExport/config";
import { inlineLayouts } from "@ext/wordExport/layouts";
import { JSONContent } from "@tiptap/core";
import { ContentText } from "pdfmake/interfaces";

const MARGIN_CONFIG: { [key: string]: { top?: number; bottom?: number } } = {
	Heading: { top: BASE_CONFIG.FONT_SIZE * 1.5, bottom: BASE_CONFIG.FONT_SIZE * 0.75 },
	p: { bottom: BASE_CONFIG.FONT_SIZE * 0.9375 },
	bulletList: { bottom: BASE_CONFIG.FONT_SIZE * 1.25 },
	orderedList: { bottom: BASE_CONFIG.FONT_SIZE * 1.25 },
	View: { top: BASE_CONFIG.FONT_SIZE * 1.25, bottom: BASE_CONFIG.FONT_SIZE * 1 },
	Fence: { top: BASE_CONFIG.FONT_SIZE * 1, bottom: BASE_CONFIG.FONT_SIZE * 1 },
	hr: { top: BASE_CONFIG.FONT_SIZE * 2, bottom: BASE_CONFIG.FONT_SIZE * 2 },
	note: { top: BASE_CONFIG.FONT_SIZE * 1.125, bottom: BASE_CONFIG.FONT_SIZE * 1.125 },
	Video: { top: BASE_CONFIG.FONT_SIZE * 1.125, bottom: BASE_CONFIG.FONT_SIZE * 1.125 },
	Image: { top: BASE_CONFIG.FONT_SIZE * 1.125, bottom: BASE_CONFIG.FONT_SIZE * 1.125 },
	Drawio: { top: BASE_CONFIG.FONT_SIZE * 1.125, bottom: BASE_CONFIG.FONT_SIZE * 1.125 },
	"Plant-uml": { top: BASE_CONFIG.FONT_SIZE * 1.125, bottom: BASE_CONFIG.FONT_SIZE * 1.125 },
	Mermaid: { top: BASE_CONFIG.FONT_SIZE * 1.125, bottom: BASE_CONFIG.FONT_SIZE * 1.125 },
	Include: { top: BASE_CONFIG.FONT_SIZE * 1.125, bottom: BASE_CONFIG.FONT_SIZE * 1.125 },
	Tab: { bottom: BASE_CONFIG.FONT_SIZE * 1.125 },
	Tabs: { top: BASE_CONFIG.FONT_SIZE, bottom: BASE_CONFIG.FONT_SIZE },
	Table: { top: BASE_CONFIG.FONT_SIZE, bottom: BASE_CONFIG.FONT_SIZE },
	...Object.fromEntries(Object.keys(inlineLayouts).map((key) => [key, { bottom: BASE_CONFIG.FONT_SIZE * 0.9375 }])),
};

export function addMargin(
	prevNode: RenderableTreeNode | JSONContent,
	currentType: string,
	currentNode?: RenderableTreeNode | JSONContent,
): ContentText | null {
	if (!prevNode) {
		return null;
	}

	const prevIsObject = typeof prevNode === "object";
	const prevAttributes =
		prevIsObject && "attributes" in prevNode && prevNode.attributes
			? prevNode.attributes
			: prevIsObject && "attrs" in prevNode && prevNode.attrs
			? prevNode.attrs
			: null;
	const currentIsObject = typeof currentNode === "object";
	const prevName = prevIsObject && "name" in prevNode ? prevNode.name : (prevNode as JSONContent).type;
	const currentAttributes =
		currentIsObject && "attributes" in currentNode && currentNode.attributes
			? currentNode.attributes
			: currentIsObject && "attrs" in currentNode && currentNode.attrs
			? currentNode.attrs
			: null;

	const currentMargin =
		currentType === "Heading" && currentAttributes?.level
			? HEADING_MARGINS[`H${currentAttributes.level}`] || { top: 0, bottom: 0 }
			: MARGIN_CONFIG[currentType] || { top: 0, bottom: 0 };

	const prevMargin =
		prevIsObject && prevName === "Heading" && prevAttributes?.level
			? HEADING_MARGINS[`H${prevAttributes.level}`] || { top: 0, bottom: 0 }
			: MARGIN_CONFIG[prevName] || { top: 0, bottom: 0 };

	const topMargin =
		prevIsObject && prevName === "Heading" && prevAttributes?.level
			? Math.max(prevMargin.bottom || 0, currentMargin.top || 0) - BASE_CONFIG.LINE_HEIGHT_MARGIN
			: Math.max(prevMargin.bottom || 0, currentMargin.top || 0) - BASE_CONFIG.LINE_HEIGHT_MARGIN;

	return {
		text: "",
		margin: [0, topMargin, 0, 0],
	};
}
