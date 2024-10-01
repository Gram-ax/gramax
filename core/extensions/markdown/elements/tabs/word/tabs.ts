import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
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
	const rows = await Promise.all(
		tag.children.map(async (tab) => {
			const tabTag = tab as Tag;
			const paragraphs = [
				createParagraph([createContent(tabTag.attributes.name, addOptions)], WordFontStyles.tabsTitle),
				...(
					await Promise.all(
						tabTag.children.map((child) =>
							state.renderBlock(child as Tag, {
								...addOptions,
								maxPictureWidth:
									(addOptions?.maxPictureWidth ?? STANDARD_PAGE_WIDTH) - INNER_BLOCK_WIDTH_DIFFERENCE,
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
