import { TextRun } from "docx";
import { WordInlineChild } from "../../../../wordExport/WordTypes";

export const whenWordLayout: WordInlineChild = async ({ tag }) => {
	return await Promise.resolve([new TextRun({ text: " / " + tag.attributes.text })]);
};
