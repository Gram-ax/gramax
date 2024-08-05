import { WordBlockChild } from "@ext/wordExport/options/WordTypes";
import { WordTableExport } from "./transformer/WordTableExport";
import { createParagraphAfterTable, createParagraphBeforeTable } from "@ext/wordExport/createParagraph";

export const tableWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	return [
		createParagraphBeforeTable(),
		await new WordTableExport(state).renderTable(state, tag, addOptions),
		createParagraphAfterTable(),
	];
};
