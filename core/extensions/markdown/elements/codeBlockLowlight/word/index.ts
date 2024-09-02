import { Paragraph, TextRun } from "docx";
import { WordBlockChild } from "@ext/wordExport/options/WordTypes";
import { createParagraphAfterTable, createParagraphBeforeTable } from "@ext/wordExport/createParagraph";
import { WordBlockType } from "@ext/wordExport/options/wordExportSettings";
import { createBlockChild } from "@ext/wordExport/createBlock";
const fenceWordLayout: WordBlockChild = async ({ tag, addOptions }) => {
	const lines = tag.attributes.value.split("\n");

	const textRuns = lines.map(
		(text, index) =>
			new TextRun({
				text,
				break: index < lines.length - 1 && index > 0 ? 1 : 0,
			}),
	);

	const paragraph = new Paragraph({
		children: textRuns,
		style: WordBlockType.fence,
	});

	const fence = await createBlockChild([paragraph], WordBlockType.fence, WordBlockType.fenceTable, addOptions);

	return [createParagraphBeforeTable(), fence, createParagraphAfterTable()];
};

export { fenceWordLayout };
