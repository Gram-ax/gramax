import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { parseNodeToPDFContent, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { Content } from "pdfmake/interfaces";

export async function snippetCase(node: Tag, context: pdfRenderContext): Promise<Content[]> {
	return await parseNodeToPDFContent(node, context);
}
