import { createBlock } from "@ext/wordExport/createBlock";
import type { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { WordBlockType } from "../../../../wordExport/options/wordExportSettings";

export const blockquoteWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	return await createBlock(state, tag, addOptions, WordBlockType.blockquote, WordBlockType.blockquote);
};
