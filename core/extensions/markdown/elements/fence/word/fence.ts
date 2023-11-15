import { Paragraph, TextRun } from "docx";
import { WordBlockChild } from "../../../../wordExport/WordTypes";
import { wordExportColors } from "../../../../wordExport/wordExportColors";
import { wordIndentSizes } from "../../../../wordExport/wordExportSizes";

export const fenceWordLayout: WordBlockChild = async ({ tag, addOptions }) => {
	const lines = tag.attributes.value.split("\n");
	return await Promise.resolve([
		new Paragraph({
			children: lines
				.map((split, i) => [
					new TextRun({
						text: split,
						highlight: wordExportColors.codeBlocks,
						break: i + 1 < lines.length ? 1 : 0,
					}),
				])
				.flat(),

			...addOptions,
			indent: {
				left: wordIndentSizes.note,
			},
		}),
	]);
};
