import { WordInlineChild } from "@ext/wordExport/options/WordTypes";

export const colorWordLayout: WordInlineChild = async ({ state, tag, addOptions }) => {
	return await state.renderInline(tag, { ...addOptions, color: tag.attributes.color });
};
