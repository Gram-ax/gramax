import { WordFontStyles, wordFontTypes } from "@ext/wordExport/options/wordExportSettings";
import { WordInlineChild } from "../../../../wordExport/options/WordTypes";

export const strongWordLayout: WordInlineChild = async ({ state, tag, addOptions }) => {
	if (addOptions?.style === WordFontStyles.link.toString())
		return state.renderInline(tag, { ...addOptions, bold: true, font: wordFontTypes.bold });

	if (addOptions?.style === WordFontStyles.emphasis.toString())
		return state.renderInline(tag, { ...addOptions, style: WordFontStyles.bookTitle });

	return state.renderInline(tag, { ...addOptions, style: WordFontStyles.strong });
};
