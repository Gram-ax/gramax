import type { WordInlineChild } from "../../../../wordExport/options/WordTypes";

export const fragmentLinkWordLayout: WordInlineChild = async ({ state, tag, addOptions }) => {
	return state.renderInline(tag, addOptions);
};
