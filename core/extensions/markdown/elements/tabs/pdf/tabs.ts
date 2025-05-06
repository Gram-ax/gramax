import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { parseNodeToPDFContent, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { JSONContent } from "@tiptap/core";
import { Content } from "pdfmake/interfaces";

export const tabsHandler = async (node: Tag | JSONContent, context: pdfRenderContext): Promise<Content[]> => {
	const name = "name" in node ? node.name : node.type;
	if (name === "tabs") {
		const results: Content[] = [];
		const children = "children" in node ? node.children : node.content;

		const tabNodes = Array.isArray(children) ? children : [];

		for (const tabNode of tabNodes) {
			if (typeof tabNode !== "object" || !("type" in tabNode) || !("name" in tabNode)) continue;
			const name = "name" in tabNode ? tabNode.name : tabNode.type;
			const attrs = "attributes" in tabNode ? tabNode.attributes : tabNode;

			if (name === "tab") {
				const tabContent = await parseNodeToPDFContent(tabNode, context);
				results.push({
					text: attrs.name,
					bold: true,
					margin: [0, 5],
				});
				results.push(...tabContent);
				results.push({ text: "", margin: [0, 5] });
			}
		}

		return results;
	}

	if (name === "tab") {
		const results: Content[] = [];

		const tabContent = await parseNodeToPDFContent(node, context);
		const attrs = "attributes" in node ? node.attributes : node;

		results.push({
			text: attrs.name,
			bold: true,
			margin: [0, 5],
		});
		results.push(...tabContent);
		results.push({ text: "", margin: [0, 10] });

		return results;
	}
};
