import { ExternalHyperlink, InternalHyperlink } from "docx";
import { TitleInfo, WordInlineChild } from "../../../../wordExport/options/WordTypes";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { generateBookmarkName } from "@ext/wordExport/generateBookmarkName";

export const linkWordLayout: WordInlineChild = async ({ state, tag, addOptions, wordRenderContext }) => {
	if (tag.attributes.resourcePath !== "") {
		const { title, order, anchor } = extractNameAndAnchor(tag.attributes.href, wordRenderContext.titlesMap);
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
			link: tag.attributes.href,
		}),
	];
};

const extractNameAndAnchor = (href: string, titlesMap: Map<string, TitleInfo>) => {
	const segments = href.split("/").pop()?.split("#");
	const fileName = segments?.[0];
	const anchor = segments?.[1];
	const { title, order } = titlesMap.get(fileName) || {};

	return { title, order, anchor };
};
