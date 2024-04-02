import { WordBlockChild } from "@ext/wordExport/WordTypes";
import { WordTableExport } from "./transformer/WordTableExport";
import { createEmptyTextRun, createParagraphBeforeTable } from "@ext/wordExport/TextWordGenerator";
import { Paragraph } from "docx";

export const tableWordLayout: WordBlockChild = async ({ state, tag }) => {
	const paragraphAfterTable = new Paragraph({
		children: [createEmptyTextRun()],
	});

	return [createParagraphBeforeTable(), await WordTableExport.renderTable(state, tag), paragraphAfterTable];
};
