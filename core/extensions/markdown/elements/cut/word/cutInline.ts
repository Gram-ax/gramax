import { WordInlineChild } from "../../../../wordExport/options/WordTypes";

export const cutInlineWordLayout: WordInlineChild = async ({ state, tag, addOptions }) => {
	return await state.renderInline(tag, { ...addOptions });
};
