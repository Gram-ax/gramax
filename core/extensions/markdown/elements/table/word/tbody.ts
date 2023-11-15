import { WordTableChild } from "./transformer/WordTableExportTypes";

export const tbodyWordLayout: WordTableChild = async (state, tag, wordTableExport, addOptions) => {
	return await wordTableExport.renderRows(tag, { ...addOptions, cantSplit: true });
};
