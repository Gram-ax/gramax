import { WordBlockChild } from "@ext/wordExport/options/WordTypes";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import docx from "@dynamicImports/docx";

export const hrWordLayout: WordBlockChild = async () => {
	const { Paragraph } = await docx();
	return Promise.resolve([new Paragraph({ style: WordFontStyles.horizontalLine })]);
};
