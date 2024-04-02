import { Paragraph, TextRun } from "docx";
import { WordBlockChild } from "../../../../wordExport/WordTypes";
import { wordFontSizes, wordIndentSizes } from "../../../../wordExport/wordExportSettings";

export const cutBlockWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	return [
		...(tag.attributes.text
			? [
					new Paragraph({
						children: [
							new TextRun({
								text: tag.attributes.text,
								bold: true,
								size: wordFontSizes.heading[2],
							}),
						],

						...addOptions,
						indent: {
							left: wordIndentSizes.note,
						},
					}),
			  ]
			: []),
		...(
			await Promise.all(
				tag.children.map((child) => {
					if (!child || typeof child === "string") return;
					return state.renderBlock(child);
				}),
			)
		)
			.flat()
			.filter((val) => val),
		new Paragraph({ text: "" }),
	];
};
