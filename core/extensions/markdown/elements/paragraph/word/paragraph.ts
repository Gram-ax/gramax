import { Bookmark, Paragraph } from "docx";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { imageWordLayout } from "@ext/markdown/elements/image/word/image";

export const paragraphWordLayout: WordBlockChild = async ({ state, tag, addOptions, wordRenderContext }) => {
	const children = "children" in tag ? tag.children : tag.content;
	const tagChild = children[0] as Tag;
	if (tagChild?.name === "Image") return imageWordLayout(tagChild, addOptions, wordRenderContext.parserContext);

	const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
	return [
		new Paragraph({
			children: [
				...(attrs.id ? [new Bookmark({ id: attrs.id, children: [] })] : []),
				...(await state.renderInline(tag, addOptions)),
			],
			...addOptions,
		}),
	];
};
