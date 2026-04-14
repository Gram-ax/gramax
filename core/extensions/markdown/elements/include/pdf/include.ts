import type { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { parseNodeToPDFContent, type pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import type { Content } from "pdfmake/interfaces";

export const includeHandler = async (node: Tag, context: pdfRenderContext): Promise<Content[]> => {
	const content: Content[] = await parseNodeToPDFContent(node, context);

	return content;
};
