import { ExternalHyperlink } from "docx";
import { WordInlineChild } from "../../../../wordExport/options/WordTypes";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";

export const linkWordLayout: WordInlineChild = async ({ state, tag, addOptions, wordRenderContext }) => {
	return [
		new ExternalHyperlink({
			children: await state.renderInline(tag, { ...addOptions, style: WordFontStyles.link }),
			link: (tag.attributes.resourcePath === "" ? "" : wordRenderContext.domain + "/") + tag.attributes.href,
		}),
	];
};
