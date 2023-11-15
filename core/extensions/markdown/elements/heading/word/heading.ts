import { Paragraph } from "docx";
import { WordBlockChild } from "../../../../wordExport/WordTypes";
import { wordFontSizes } from "../../../../wordExport/wordExportSizes";

const convertMmToSpacingUnits = 8;

export const headingWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	return [
		new Paragraph({
			children: await state.renderInline(tag, {
				...addOptions,
				size: wordFontSizes.heading[tag.attributes.level] ?? wordFontSizes.normal,
				bold: true,
			}),
			spacing: {
				after: (wordFontSizes.heading[tag.attributes.level] ?? wordFontSizes.normal) * convertMmToSpacingUnits,
				before: (wordFontSizes.heading[tag.attributes.level] ?? wordFontSizes.normal) * convertMmToSpacingUnits,
			},
		}),
	];
};
