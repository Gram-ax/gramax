import type { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { parseNodeToPDFContent, type pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import type { Content } from "pdfmake/interfaces";

export async function snippetCase(node: Tag, context: pdfRenderContext): Promise<Content[]> {
	return await parseNodeToPDFContent(node, context);
}
