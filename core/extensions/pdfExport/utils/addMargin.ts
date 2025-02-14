import { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG, HEADING_MARGINS } from "@ext/pdfExport/config";
import { isTag } from "@ext/pdfExport/utils/isTag";
import { inlineLayouts } from "@ext/wordExport/layouts";
import { ContentText } from "pdfmake/interfaces";

const MARGIN_CONFIG: { [key: string]: { top?: number; bottom?: number } } = {
	Heading: { top: BASE_CONFIG.FONT_SIZE * 1.5, bottom: BASE_CONFIG.FONT_SIZE * 0.75 },
	p: { bottom: BASE_CONFIG.FONT_SIZE * 0.9375 },
	ul: { bottom: BASE_CONFIG.FONT_SIZE * 1.25 },
	ol: { bottom: BASE_CONFIG.FONT_SIZE * 1.25 },
	Fence: { top: BASE_CONFIG.FONT_SIZE * 1, bottom: BASE_CONFIG.FONT_SIZE * 1 },
	hr: { top: BASE_CONFIG.FONT_SIZE * 2, bottom: BASE_CONFIG.FONT_SIZE * 2 },
	Note: { top: BASE_CONFIG.FONT_SIZE * 1.125, bottom: BASE_CONFIG.FONT_SIZE * 1.125 },
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
	prevNode: RenderableTreeNode,
	currentType: string,
	currentNode?: RenderableTreeNode,
): ContentText | null {
	if (!prevNode) {
		return null;
	}

	const currentMargin =
		currentType === "Heading" && isTag(currentNode) && currentNode.attributes?.level
			? HEADING_MARGINS[`H${currentNode.attributes.level}`] || { top: 0, bottom: 0 }
			: MARGIN_CONFIG[currentType] || { top: 0, bottom: 0 };

	const prevMargin =
		isTag(prevNode) && prevNode.name === "Heading" && prevNode.attributes?.level
			? HEADING_MARGINS[`H${prevNode.attributes.level}`] || { top: 0, bottom: 0 }
			: MARGIN_CONFIG[isTag(prevNode) ? prevNode.name : ""] || { top: 0, bottom: 0 };

	const topMargin =
		isTag(prevNode) && currentType === "Heading"
			? Math.max(prevMargin.bottom || 0, currentMargin.top || 0) - BASE_CONFIG.LINE_HEIGHT_MARGIN
			: Math.max(prevMargin.bottom || 0, currentMargin.top || 0) - BASE_CONFIG.LINE_HEIGHT_MARGIN;

	return {
		text: "",
		margin: [0, topMargin, 0, 0],
	};
}
