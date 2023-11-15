import { TextRun } from "docx";
import { WordInlineChild } from "@ext/wordExport/WordTypes";

export const brWordLayout: WordInlineChild = async () => {
	return await Promise.resolve([new TextRun({ text: "", break: 1 })]);
};
