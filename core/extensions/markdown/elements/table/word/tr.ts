import { WordTableChild } from "./transformer/WordTableExportTypes";

export const trWordLayout: WordTableChild = async (state, tag, wordTableExport, addOptions) => {
	return await wordTableExport.renderRow(tag, addOptions);
};
