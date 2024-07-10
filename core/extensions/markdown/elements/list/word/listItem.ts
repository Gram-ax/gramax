import { Paragraph, TextRun } from "docx";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { getBlockChildren } from "../../../../wordExport/getBlockChildren";
import { Tag } from "../../../core/render/logic/Markdoc";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { imageWordLayout } from "@ext/markdown/elements/image/word/image";

export const listItemWordLayout: WordBlockChild = async ({ state, tag, addOptions, resourceManager, parserContext }) => {
	const filteredChildren = transformerToNormalTag(tag).children.filter(
		(child) => child && typeof child !== "string",
	) as Tag[];
	const blockLayouts = getBlockChildren();
	const listElements = [];
	let paragraph = [];

	for (let i = 0; i < filteredChildren.length; i++) {
		const child = filteredChildren[i];

		if (child.name === "p") {
			if ((child.children[0] as Tag)?.name === "Image") {
				if (paragraph.length > 0) {
					listElements.push(
						new Paragraph({
							children: paragraph.flat(),
							...addOptions,
						}),
					);
					paragraph = [];
				}

				listElements.push(await imageWordLayout(child.children[0] as Tag, resourceManager, parserContext));
			} else {
				const inlineElements = await state.renderInline(child);

				const nextChildIsNotImage = !(
					filteredChildren[i + 1] && (filteredChildren[i + 1].children[0] as Tag)?.name === "Image"
				);

				paragraph.push([
					...inlineElements.flat().filter((val) => val),
					...(inlineElements &&
					tag.children.length > 1 &&
					tag.children[tag.children.length - 1] !== tag.children[i] &&
					nextChildIsNotImage &&
					(!blockLayouts[(tag.children[i + 1] as Tag)?.name] || (tag.children[i + 1] as Tag)?.name === "p")
						? [new TextRun({ break: 1 })]
						: []),
				]);
			}

			continue;
		}

		if (paragraph.length > 0) {
			listElements.push(
				new Paragraph({
					children: paragraph.flat(),
					...addOptions,
				}),
			);
			paragraph = [];
		}

		listElements.push(await state.renderBlock(child));
	}

	if (paragraph.length > 0) {
		listElements.push(
			new Paragraph({
				children: paragraph.flat(),
				...addOptions,
				style: WordFontStyles.listParagraph,
			}),
		);
	}

	return listElements;
};

const transformerToNormalTag = (tag: Tag) => {
	if (!tag.children.length || ["p", "li"].includes((tag.children[0] as Tag)?.name)) return tag;

	return new Tag("li", {}, [new Tag("p", {}, tag.children)]);
};
