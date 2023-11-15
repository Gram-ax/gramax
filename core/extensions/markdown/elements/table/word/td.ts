import { WordTableChild } from "./transformer/WordTableExportTypes";

export const tdWordLayout: WordTableChild = async (state, tag, wordTableExport) => {
	return await wordTableExport.renderCell(tag);
};
