import { WordTableChild } from "./transformer/WordTableExportTypes";

export const theadWordLayout: WordTableChild = async (state, tag, wordTableExport, addOptions) => {
	return await wordTableExport.renderRows(tag, { ...addOptions, tableHeader: true });
};
