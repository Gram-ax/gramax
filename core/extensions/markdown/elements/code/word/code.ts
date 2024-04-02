import { WordInlineChild } from "@ext/wordExport/WordTypes";
import { wordFontSizes, wordFontTypes } from "@ext/wordExport/wordExportSettings";
import { BorderStyle } from "docx";

export const codeWordLayout: WordInlineChild = async ({ state, tag, addOptions }) => {
	const font = wordFontTypes.code;
	const border = { style: BorderStyle.SINGLE };
	const size = wordFontSizes.code;
	const options = { ...addOptions, font, border, size, isCode: true };

	return await state.renderInline(tag, options);
};
