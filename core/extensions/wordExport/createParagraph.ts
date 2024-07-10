import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { createEmptyTextRun } from "@ext/wordExport/TextWordGenerator";
import { Paragraph, ParagraphChild } from "docx";

export function createParagraph(children: ParagraphChild[], style?: string) {
	return new Paragraph({ children, style });
}

export function createParagraphBeforeTable() {
	return new Paragraph({ children: [createEmptyTextRun()], style: WordFontStyles.notExportBeforeTable });
}

export function createParagraphAfterTable() {
	return new Paragraph({ children: [createEmptyTextRun()], style: WordFontStyles.notExportAfterTable });
}
