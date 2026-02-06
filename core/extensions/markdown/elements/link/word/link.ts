import docx from "@dynamicImports/docx";
import { generateBookmarkName } from "@ext/wordExport/generateBookmarkName";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { escapeLinkForPatcher } from "@ext/wordExport/utils/escapeLinkForPatcher";
import type { TitleInfo, WordInlineChild } from "../../../../wordExport/options/WordTypes";

export const linkWordLayout: WordInlineChild = async ({ state, tag, addOptions, wordRenderContext }) => {
	const { ExternalHyperlink, InternalHyperlink } = await docx();
	if (tag.attributes.resourcePath !== "") {
		const { title, order, anchor } = extractNameAndAnchor(tag.attributes, wordRenderContext.titlesMap);
		return title
			? [
					new InternalHyperlink({
						children: await state.renderInline(tag, { ...addOptions, style: WordFontStyles.link }),
						anchor: generateBookmarkName(order, title, anchor),
					}),
				]
			: await state.renderInline(tag, addOptions);
	}

	return [
		new ExternalHyperlink({
			children: await state.renderInline(tag, { ...addOptions, style: WordFontStyles.link }),
			link: escapeLinkForPatcher(tag.attributes.href),
		}),
	];
};

export const extractNameAndAnchor = (linkAttr: { href: string; hash?: string }, titlesMap: Map<string, TitleInfo>) => {
	const fileName = linkAttr.href.split("/").pop();
	const anchor = linkAttr.hash ? decodeURIComponent(linkAttr.hash.replace("#", "")) : "";
	const { title, order } = titlesMap.get(fileName) || {};

	return { title, order, anchor };
};
