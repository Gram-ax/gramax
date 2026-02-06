import { createBlock } from "@ext/wordExport/createBlock";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { WordBlockType } from "../../../../wordExport/options/wordExportSettings";

export const cutBlockWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	return [...(await createBlock(state, tag, addOptions, WordBlockType.cut, WordBlockType.cutTable))];
};
