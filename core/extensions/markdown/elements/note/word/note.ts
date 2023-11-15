import { Paragraph, TextRun } from "docx";
import { WordBlockChild } from "../../../../wordExport/WordTypes";
import { wordFontSizes, wordIndentSizes } from "../../../../wordExport/wordExportSizes";

export const noteWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	return [
		new Paragraph({
			children: [
				...(tag.attributes.title
					? [
							new TextRun({
								text: tag.attributes.title,
								bold: true,
								size: wordFontSizes.heading[4],
							}),
							new TextRun({
								text: "",
								break: 1,
							}),
					  ]
					: []),
				...(await state.renderBlockAsInline(tag)),
			],
			indent: {
				left: wordIndentSizes.note,
			},
			...addOptions,
		}),
	];
};
