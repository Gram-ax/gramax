import { WordBlockChild } from "@ext/wordExport/options/WordTypes";
import { WordTableExport } from "./transformer/WordTableExport";

export const tableWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	const table = await new WordTableExport(state).renderTable(state, tag, addOptions);

	return [table];
};
