import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { createEmptyTextRun } from "@ext/wordExport/TextWordGenerator";
import type { ParagraphChild } from "docx";
import docx from "@dynamicImports/docx";

export async function createParagraph(children: ParagraphChild[], style?: string) {
	const { Paragraph } = await docx();
	return new Paragraph({ children, style });
}

export async function createParagraphBeforeTable() {
	const { Paragraph } = await docx();
	return new Paragraph({ children: [await createEmptyTextRun()], style: WordFontStyles.notExportBeforeTable });
}

export async function createParagraphAfterTable() {
	const { Paragraph } = await docx();
	return new Paragraph({ children: [await createEmptyTextRun()], style: WordFontStyles.notExportAfterTable });
}
