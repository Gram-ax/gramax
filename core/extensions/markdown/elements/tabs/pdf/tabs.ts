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
			if (tabNode?.type !== "tab") continue;
			
			const name = tabNode?.attrs?.name;
			const tabContent = await parseNodeToPDFContent(tabNode, context);
			
			results.push({
				text: name,
				bold: true,
				margin: [0, 5],
			});
			results.push(...tabContent);
			results.push({ text: "", margin: [0, 5] });
		}

		return results;
	}
};
