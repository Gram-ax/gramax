import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { WordInlineChild } from "../../../../wordExport/options/WordTypes";

export const emWordLayout: WordInlineChild = async ({ state, tag, addOptions }) => {
	return await state.renderInline(tag, {
		...addOptions,
		italics: true,
		style: addOptions?.style ?? WordFontStyles.emphasis,
	});
};
