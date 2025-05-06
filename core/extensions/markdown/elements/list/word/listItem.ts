import { imageWordLayout } from "@ext/markdown/elements/image/word/image";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { Paragraph, TextRun } from "docx";
import { getBlockChildren } from "../../../../wordExport/getBlockChildren";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { Tag } from "../../../core/render/logic/Markdoc";
import { JSONContent } from "@tiptap/core";

export const listItemWordLayout: WordBlockChild = async ({ state, tag, addOptions, wordRenderContext }) => {
	const blockLayouts = getBlockChildren();
	const listElements = [];
	let paragraph = [];
	const children = "children" in tag ? tag.children : tag.content;

	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		const childName = "name" in child ? child.name : child.type;
		const childContent = "content" in child ? child.content : child.children;

		if (childName === "p") {
			if ((childContent[0] as JSONContent)?.type === "Image" || (childContent[0] as Tag)?.name === "Image") {
				if (paragraph.length > 0) {
					listElements.push(
						new Paragraph({
							children: paragraph.flat(),
							...addOptions,
						}),
					);
					paragraph = [];
				}

				listElements.push(
					await imageWordLayout(
						(child?.children[0] as Tag) || (child?.content[0] as Tag),
						addOptions,
						wordRenderContext.parserContext,
					),
				);
			} else {
				const inlineElements = await state.renderInline(child);

				const isLastChild = children[children.length - 1] === child;
				const nextChild = children[i + 1];
				const nextChildIsImage =
					nextChild &&
					((nextChild.children?.[0] as Tag)?.name === "Image" ||
						(nextChild as JSONContent)?.content?.[0]?.type === "Image");

				const nextChildIsBlockOrParagraph =
					!nextChild ||
					(!blockLayouts[nextChild?.name] && !blockLayouts[nextChild?.type]) ||
					nextChild?.name === "p" ||
					nextChild?.type === "p";

				const shouldAddLineBreak =
					inlineElements &&
					children.length > 1 &&
					!isLastChild &&
					!nextChildIsImage &&
					nextChildIsBlockOrParagraph;

				paragraph.push([
					...inlineElements.flat().filter((val) => val),
					...(shouldAddLineBreak ? [new TextRun({ break: 1 })] : []),
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
