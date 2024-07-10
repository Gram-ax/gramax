import { AddOptionsWord } from "@ext/wordExport/options/WordTypes";
import { NON_BREAKING_SPACE } from "@ext/wordExport/options/wordExportSettings";
import { IRunOptions, TextRun } from "docx";

export function createContent(text: string, addOptions?: AddOptionsWord) {
	return new TextRun({ text, ...addOptions as IRunOptions });
}

export const createEmptyTextRun = () => createContent(NON_BREAKING_SPACE);
