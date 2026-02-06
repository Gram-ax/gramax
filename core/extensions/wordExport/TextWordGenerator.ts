import docx from "@dynamicImports/docx";
import type { AddOptionsWord } from "@ext/wordExport/options/WordTypes";
import { NON_BREAKING_SPACE } from "@ext/wordExport/options/wordExportSettings";
import type { IRunOptions } from "docx";

export async function createContent(text: string, addOptions?: AddOptionsWord) {
	const { TextRun } = await docx();
	return new TextRun({ text, ...(addOptions as IRunOptions) });
}

export const createEmptyTextRun = () => createContent(NON_BREAKING_SPACE);
