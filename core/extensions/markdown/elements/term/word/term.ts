import docx from "@dynamicImports/docx";
import { WordInlineChild } from "../../../../wordExport/options/WordTypes";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { escapeLinkForPatcher } from "@ext/wordExport/utils/escapeLinkForPatcher";

export const termWordLayout: WordInlineChild = async ({ tag, addOptions }) => {
	const { ExternalHyperlink } = await docx();
	return Promise.resolve([
		new ExternalHyperlink({
			children: [await createContent(tag.attributes.title, { ...addOptions, style: WordFontStyles.term })],
			link: escapeLinkForPatcher(tag.attributes.url),
		}),
	]);
};
