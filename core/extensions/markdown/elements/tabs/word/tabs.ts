import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { JSONContent } from "@tiptap/core";
import { WordBlockChild } from "@ext/wordExport/options/WordTypes";
import {
	STANDARD_PAGE_WIDTH,
	WordBlockType,
	wordBordersType,
	WordFontStyles,
	wordMarginsType,
} from "@ext/wordExport/options/wordExportSettings";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import { createParagraph } from "@ext/wordExport/createParagraph";
import { Table, TableCell, TableRow, WidthType } from "docx";

const INNER_BLOCK_WIDTH_DIFFERENCE = 310;

export const tabsWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	const children = "children" in tag ? tag.children : tag.content;
	const rows = await Promise.all(
		children.map(async (tab: Tag | JSONContent) => {
			const tabTag = tab;
			const attrs = "attributes" in tabTag ? tabTag.attributes : tabTag.attrs;
			const children = "children" in tabTag ? tabTag.children : tabTag.content;
			const paragraphs = [
				createParagraph([createContent(attrs.name, addOptions)], WordFontStyles.tabsTitle),
				...(
					await Promise.all(
						children.map((child) =>
							state.renderBlock(child as Tag, {
								...addOptions,
								maxTableWidth:
									(addOptions?.maxTableWidth ?? STANDARD_PAGE_WIDTH) - INNER_BLOCK_WIDTH_DIFFERENCE,
							}),
						),
					)
				).flat(),
			];

			return new TableRow({
				children: [new TableCell({ children: paragraphs })],
			});
		}),
	);

	return [
		new Table({
			rows,
			width: { size: addOptions?.maxTableWidth ?? STANDARD_PAGE_WIDTH, type: WidthType.DXA },
			borders: wordBordersType[WordBlockType.tabs],
			margins: wordMarginsType[WordBlockType.tabs],
			style: WordBlockType.tabs,
		}),
	];
};
