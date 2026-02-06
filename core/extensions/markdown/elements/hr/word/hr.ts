import docx from "@dynamicImports/docx";
import type { WordBlockChild } from "@ext/wordExport/options/WordTypes";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";

export const hrWordLayout: WordBlockChild = async () => {
	const { Paragraph } = await docx();
	return Promise.resolve([new Paragraph({ style: WordFontStyles.horizontalLine })]);
};
