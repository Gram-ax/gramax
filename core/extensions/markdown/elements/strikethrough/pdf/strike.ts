import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { extractContent } from "@ext/pdfExport/utils/extractTextForCases";
import { ContentText } from "pdfmake/interfaces";

export const strikeHandler = async (node: Tag): Promise<ContentText[]> => {
	const resolvedContent = await Promise.all((node.children || []).map((child) => extractContent(child, undefined)));

	return resolvedContent.flat().map((item) => ({
		...item,
		decoration: "lineThrough",
	}));
};
