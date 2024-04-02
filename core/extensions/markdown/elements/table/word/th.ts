import { WordTableChild } from "./transformer/WordTableExportTypes";

export const thWordLayout: WordTableChild = async (state, tag, wordTableExport) => {
	return await wordTableExport.renderCell(tag, true);
};
