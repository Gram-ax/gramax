import { Content } from "pdfmake/interfaces";
import { extractContent } from "@ext/pdfExport/utils/extractTextForCases";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";

export async function paragraphCase(node: Tag): Promise<Content[]> {
	const contentPromises = (node.children || []).map(async (item) => {
		return extractContent(item);
	});

	const resolvedContent = await Promise.all(contentPromises);
	const filteredContent = resolvedContent.filter(Boolean);
	const flatContent = filteredContent.flat();

	const textContent = flatContent.map((item) => {
		const contentText: any = { text: item.text || "", lineHeight: 1.35 };
		return Object.assign(contentText, item);
	});

	return [
		{
			text: textContent,
		},
	];
}
