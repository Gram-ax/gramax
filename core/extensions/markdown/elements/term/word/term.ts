import { ExternalHyperlink } from "docx";
import { WordInlineChild } from "../../../../wordExport/options/WordTypes";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";

export const termWordLayout: WordInlineChild = async ({ tag, addOptions }) => {
	return Promise.resolve([
		new ExternalHyperlink({
			children: [createContent(tag.attributes.title, { ...addOptions, style: WordFontStyles.term })],
			link: tag.attributes.url,
		}),
	]);
};
