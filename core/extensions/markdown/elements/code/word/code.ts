import { WordInlineChild } from "@ext/wordExport/options/WordTypes";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";

export const codeWordLayout: WordInlineChild = async ({ state, tag }) => {
	return await state.renderInline(tag, { style: WordFontStyles.code, code: true });
};
