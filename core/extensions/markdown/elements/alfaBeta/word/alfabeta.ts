import { TextRun } from "docx";
import { WordInlineChild } from "../../../../wordExport/WordTypes";

export const alphaWordLayout: WordInlineChild = async () => {
	return await Promise.resolve([new TextRun({ text: "αlfa", highlight: "red" })]);
};

export const betaWordLayout: WordInlineChild = async () => {
	return await Promise.resolve([new TextRun({ text: "βeta", highlight: "yellow" })]);
};
