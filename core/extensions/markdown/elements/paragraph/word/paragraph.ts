import { Bookmark, Paragraph } from "docx";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { imageWordLayout } from "@ext/markdown/elements/image/word/image";

export const paragraphWordLayout: WordBlockChild = async ({
	state,
	tag,
	addOptions,
	resourceManager,
	parserContext,
}) => {
	const tagChild = tag.children[0] as Tag;
	if (tagChild?.name === "Image") return imageWordLayout(tagChild, addOptions, resourceManager, parserContext);

	return [
		new Paragraph({
			children: [
				...(tag.attributes.id ? [new Bookmark({ id: tag.attributes.id, children: [] })] : []),
				...(await state.renderInline(tag, addOptions)),
			],
			...addOptions,
		}),
	];
};
