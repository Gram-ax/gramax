import { ContentText } from "pdfmake/interfaces";
import { extractContent } from "@ext/pdfExport/utils/extractTextForCases";
import { BASE_CONFIG } from "@ext/pdfExport/config";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";

export async function headingHandler(node: Tag): Promise<ContentText> {
	const level = node.attributes?.level;

	if (level < 1 || level > 4) {
		throw new Error(`Invalid heading level: ${level}`);
	}

	const textContent = await extractContent(node);
	const cleanedTextContent = textContent.map((item) => {
		const { fontSize, ...rest } = item;
		return rest;
	});

	return {
		text: cleanedTextContent,
		style: `H${level}`,
		font: "RobotoRegular",
		lineHeight: BASE_CONFIG.LINE_HEIGHT * 0.725,
	};
}
