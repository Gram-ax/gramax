import { WordInlineChild } from "../../../../wordExport/WordTypes";

export const strongWordLayout: WordInlineChild = async ({ state, tag, addOptions }) => {
	return await state.renderInline(tag, { ...addOptions, bold: true });
};
