import docx from "@dynamicImports/docx";
import { AddOptionsWord, WordBlockChild } from "@ext/wordExport/options/WordTypes";
import { WordBlockType } from "@ext/wordExport/options/wordExportSettings";
import { createBlockChild } from "@ext/wordExport/createBlock";
import { highlightCodeToRuns } from "./highlightToRuns";

const fenceWordLayout: WordBlockChild = async ({ tag, addOptions }) => {
	return getCodeBlock(tag.attributes.value, tag.attributes.language ?? undefined, addOptions);
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
