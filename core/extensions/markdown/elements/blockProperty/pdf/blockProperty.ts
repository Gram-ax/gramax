import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { parseNodeToPDFContent, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { Content } from "pdfmake/interfaces";

export const blockPropertyHandler = async (node: Tag, context: pdfRenderContext): Promise<Content[]> => {
	const results: Content[] = [];

	const content = await parseNodeToPDFContent(node, context);
	results.push(...content);
	return results;
};
