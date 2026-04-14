import resolveBackendModule from "@app/resolveModule/backend";
import { isTextNodeName } from "@ext/serach/utils/svgTextExtract";

export async function extractTextsSvg(svgContent: string): Promise<string[]> {
	const domParser = resolveBackendModule("getDOMParser")();
	const normalizedSvgContent = normalizeSvgContent(svgContent);
	const doc = domParser.parseFromString(normalizedSvgContent, "image/svg+xml");
	const root = doc.documentElement ?? doc;
	return collectSelectedElements(root);
}

function collectSelectedElements(root: Node): string[] {
	const result: string[] = [];

	/**
	 * @returns true if text was collected
	 */
	const walk = (node: Node): boolean => {
		const nodeName = getNodeName(node);
		if (nodeName === "style") return false;

		if (isTextNode(node)) {
			const text = node.textContent?.trim() ?? "";
			if (text) {
				result.push(text);
				return true;
			}
			return false;
		}

		if (!isElementNode(node)) return false;

		if (isTextNodeName(nodeName)) {
			const text = node.textContent?.trim() ?? "";
			if (text) {
				result.push(text);
				return true;
			}

			return false;
		}

		for (let index = 0; index < node.childNodes.length; index += 1) {
			walk(node.childNodes[index]);
			// switch can duplicate texts, so we take first node
			//   and hope this node contains text
			if (nodeName === "switch") break;
		}

		return false;
	};

	walk(root);
	return result;
}

function isElementNode(node: Node): node is Element {
	return node.nodeType === 1;
}

function isTextNode(node: Node): node is Text {
	return node.nodeType === 3;
}

function getNodeName(node: Node): string {
	return (node.nodeName || "").toLowerCase();
}

function normalizeSvgContent(svgContent: string): string {
	return svgContent.replace(/<br\s*\/?>/gi, "\n");
}
