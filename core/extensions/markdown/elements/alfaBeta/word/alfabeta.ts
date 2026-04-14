import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import type { WordInlineChild } from "../../../../wordExport/options/WordTypes";

export const alfaWordLayout: WordInlineChild = async ({ addOptions }) => {
	return await Promise.resolve([await createContent("αlfa", { ...addOptions, style: WordFontStyles.alfa })]);
};

export const betaWordLayout: WordInlineChild = async ({ addOptions }) => {
	return await Promise.resolve([await createContent("βeta", { ...addOptions, style: WordFontStyles.beta })]);
};
