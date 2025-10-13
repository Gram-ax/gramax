import { WordInlineChild } from "../../../../wordExport/options/WordTypes";
import { NON_BREAKING_SPACE, WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { createContent } from "@ext/wordExport/TextWordGenerator";

export const kbdWordLayout: WordInlineChild = async ({ tag, addOptions }) => {
	return await Promise.resolve([
		await createContent(NON_BREAKING_SPACE + tag.attributes.text + NON_BREAKING_SPACE, {
			...addOptions,
			style: WordFontStyles.kbd,
		}),
	]);
};
