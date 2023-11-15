import { TextRun } from "docx";
import { WordInlineChild } from "../../../../wordExport/WordTypes";

export const whoWordLayout: WordInlineChild = async ({ tag }) => {
	return await Promise.resolve([new TextRun({ text: " / " + tag.attributes.text })]);
};
