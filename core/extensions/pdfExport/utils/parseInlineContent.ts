import type { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { extractContent } from "@ext/pdfExport/utils/extractTextForCases";
import type { JSONContent } from "@tiptap/core";
import type { ContentText } from "pdfmake/interfaces";

export const parseInlineContent = (node: Tag | JSONContent): Promise<ContentText[]>[] => {
	const children = "children" in node ? node.children : node.content;
	return children.map((child) => extractContent(child, undefined));
};
