import { WordInlineChild } from "../../../../wordExport/options/WordTypes";

export const strikeWordLayout: WordInlineChild = async ({ state, tag, addOptions }) => {
	return state.renderInline(tag, { ...addOptions, strike: true });
};
