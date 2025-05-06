import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { parseNodeToPDFContent, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { Content } from "pdfmake/interfaces";

export const blockContentFieldHandler = async (node: Tag, context: pdfRenderContext): Promise<Content[]> => {
	const results: Content[] = [];

	const content = await parseNodeToPDFContent(node, context);
	results.push({
		text: node.attributes.name,
		bold: true,
		margin: [0, 5],
	});
	results.push(...content);
	results.push({ text: "", margin: [0, 10] });
	return results;
};
