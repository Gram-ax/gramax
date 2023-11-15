import { WordInlineChild } from "../../../../wordExport/WordTypes";

export const cutInlineWordLayout: WordInlineChild = async ({ state, tag, addOptions }) => {
	return await state.renderInline(tag, { ...addOptions });
};
