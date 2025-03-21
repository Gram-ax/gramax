import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { parseNodeToPDFContent, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { Content } from "pdfmake/interfaces";

export const includeHandler = async (node: Tag, context: pdfRenderContext): Promise<Content[]> => {
	const content: Content[] = await parseNodeToPDFContent(node, context);

	return content;
};
