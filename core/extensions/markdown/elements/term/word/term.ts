import { IRunOptions, TextRun } from "docx";
import { WordInlineChild } from "../../../../wordExport/WordTypes";

export const termWordLayout: WordInlineChild = async ({ tag, addOptions }) => {
	return await Promise.resolve([new TextRun({ text: tag.attributes.title, ...(addOptions as IRunOptions) })]);
};
