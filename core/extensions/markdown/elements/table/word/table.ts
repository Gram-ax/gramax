import { WordBlockChild } from "@ext/wordExport/WordTypes";
import { WordTableExport } from "./transformer/WordTableExport";

export const tableWordLayout: WordBlockChild = async ({ state, tag }) => {
	return [await WordTableExport.renderTable(state, tag)];
};
