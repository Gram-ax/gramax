import docx from "@dynamicImports/docx";
import { createBlockChild } from "@ext/wordExport/createBlock";
import type { AddOptionsWord, WordBlockChild } from "@ext/wordExport/options/WordTypes";
import { WordBlockType } from "@ext/wordExport/options/wordExportSettings";
import type { JSONContent } from "@tiptap/core";
import { highlightCodeToRuns } from "./highlightToRuns";

const fenceWordLayout: WordBlockChild<JSONContent> = async ({ tag, addOptions }) => {
	return getCodeBlock(tag.content[0] as never as string, tag.attrs.language ?? undefined, addOptions);
};

export const getCodeBlock = async (code: string, language: string | undefined, addOptions: AddOptionsWord) => {
	const { Paragraph, TextRun } = await docx();
	const runs = await highlightCodeToRuns(code ?? "", language, TextRun);
	const paragraph = new Paragraph({
		children: runs,
		style: WordBlockType.fence,
	});

	const fence = await createBlockChild([paragraph], WordBlockType.fence, WordBlockType.fenceTable, addOptions);
	return [fence];
};

export { fenceWordLayout };
