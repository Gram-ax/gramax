import docx from "@dynamicImports/docx";
import { WordInlineChild } from "@ext/wordExport/options/WordTypes";

export const brWordLayout: WordInlineChild = async () => {
	const { TextRun } = await docx();
	return await Promise.resolve([new TextRun({ text: "", break: 1 })]);
};
