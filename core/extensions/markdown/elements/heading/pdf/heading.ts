import { ContentText } from "pdfmake/interfaces";
import { extractContent } from "@ext/pdfExport/utils/extractTextForCases";
import { BASE_CONFIG } from "@ext/pdfExport/config";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { generateBookmarkName } from "@ext/wordExport/generateBookmarkName";

export async function headingHandler(node: Tag, context: pdfRenderContext): Promise<ContentText> {
	const level = node.attributes?.level;

	const bookmarkName = generateBookmarkName(context.order, context.articleName, node.attributes.id);
	const uniqueId = getUniqueId(bookmarkName, context.headingMap);

	if (level < 1 || level > 4) {
		throw new Error(`Invalid heading level: ${level}`);
	}

	const textContent = await extractContent(node, context);
	const cleanedTextContent = textContent.map((item) => {
		const { fontSize, ...rest } = item;
		return rest;
	});

	return {
		text: [{ text: cleanedTextContent, id: uniqueId }],
		style: `H${level}`,
		font: "RobotoRegular",
		lineHeight: BASE_CONFIG.LINE_HEIGHT * 0.725,
	};
}

function getUniqueId(baseId: string, headingMap: Map<string, number>): string {
	let uniqueId = baseId;
	let count = 1;

	while (headingMap.has(uniqueId)) {
		uniqueId = `${baseId}_${count}`;
		count++;
	}

	headingMap.set(uniqueId, headingMap.size + 1);
	return uniqueId;
}
