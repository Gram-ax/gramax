import { WordInlineChild } from "../../../../wordExport/WordTypes";

export const emWordLayout: WordInlineChild = async ({ state, tag, addOptions }) => {
	return await state.renderInline(tag, { ...addOptions, italics: true });
};
