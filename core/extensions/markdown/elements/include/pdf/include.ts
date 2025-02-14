import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { parseNodeToPDFContent } from "@ext/pdfExport/parseNodesPDF";
import { Content } from "pdfmake/interfaces";

export const includeHandler = async (node: Tag): Promise<Content[]> => {
	const content: Content[] = await parseNodeToPDFContent(node);

	return content;
};
