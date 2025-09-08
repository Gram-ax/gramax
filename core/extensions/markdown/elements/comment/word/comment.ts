import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { WordInlineChild } from "../../../../wordExport/options/WordTypes";

export const commentWordLayout: WordInlineChild = async ({ state, tag, addOptions }) => {
	return state.renderInline(tag, { ...addOptions, style: WordFontStyles.normal });
};
