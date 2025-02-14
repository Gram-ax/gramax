import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { parseNodeToPDFContent } from "@ext/pdfExport/parseNodesPDF";
import { isTag } from "@ext/pdfExport/utils/isTag";
import { Content } from "pdfmake/interfaces";

export const tabsHandler = async (node: Tag): Promise<Content[]> => {
	if (node.name === "Tabs") {
		const results: Content[] = [];

		const tabNodes = Array.isArray(node.children) ? node.children : [];

		for (const tabNode of tabNodes) {
			if (isTag(tabNode) && tabNode.name === "Tab") {
				const tabContent = await parseNodeToPDFContent(tabNode);
				results.push({
					text: tabNode.attributes.name,
					bold: true,
					margin: [0, 5],
				});
				results.push(...tabContent);
				results.push({ text: "", margin: [0, 5] });
			}
		}
		return results;
	}

	if (node.name === "Tab") {
		const results: Content[] = [];

		const tabContent = await parseNodeToPDFContent(node);
		results.push({
			text: node.attributes.name,
			bold: true,
			margin: [0, 5],
		});
		results.push(...tabContent);
		results.push({ text: "", margin: [0, 10] });
		return results;
	}
};
