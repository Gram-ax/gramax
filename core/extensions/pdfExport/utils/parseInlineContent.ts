import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { extractContent } from "@ext/pdfExport/utils/extractTextForCases";
import { ContentText } from "pdfmake/interfaces";

export const parseInlineContent = (node: Tag): Promise<ContentText[]>[] => {
	return (node.children || []).map((child) => extractContent(child, undefined));
};
