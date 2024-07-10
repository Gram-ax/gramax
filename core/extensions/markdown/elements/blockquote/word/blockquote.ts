import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { WordBlockType } from "../../../../wordExport/options/wordExportSettings";
import { createBlock } from "@ext/wordExport/createBlock";

export const blockquoteWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	return await createBlock(state, tag, addOptions, WordBlockType.blockquote, WordBlockType.blockquote);
};
