import docx from "@dynamicImports/docx";
import { AddOptionsWord, WordBlockChild } from "@ext/wordExport/options/WordTypes";
import { createParagraphAfterTable, createParagraphBeforeTable } from "@ext/wordExport/createParagraph";
import { WordBlockType } from "@ext/wordExport/options/wordExportSettings";
import { createBlockChild } from "@ext/wordExport/createBlock";

const fenceWordLayout: WordBlockChild = async ({ tag, addOptions }) => {
	return getCodeBlock(tag.attributes.value.split("\n"), addOptions);
};

export const getCodeBlock = async (lines: string[], addOptions: AddOptionsWord) => {
	const { Paragraph, TextRun } = await docx();
	const paragraph = new Paragraph({
		children: lines.map(
			(text, index) =>
				new TextRun({
					text,
					break: index > 0 ? 1 : 0,
				}),
		),
		style: WordBlockType.fence,
	});

	const fence = await createBlockChild([paragraph], WordBlockType.fence, WordBlockType.fenceTable, addOptions);

	return [await createParagraphBeforeTable(), fence, await createParagraphAfterTable()];
};

export { fenceWordLayout };
