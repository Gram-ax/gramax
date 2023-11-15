import { WordInlineChild } from "@ext/wordExport/WordTypes";
import { wordExportColors } from "@ext/wordExport/wordExportColors";

export const codeWordLayout: WordInlineChild = async ({ state, tag, addOptions }) => {
	return await state.renderInline(tag, { ...addOptions, highlight: wordExportColors.codeBlocks });
};
