import { WordBlockChild } from "@ext/wordExport/options/WordTypes";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { Paragraph } from "docx";

export const hrWordLayout: WordBlockChild = async () => {
	return Promise.resolve([new Paragraph({ style: WordFontStyles.horizontalLine })]);
};
