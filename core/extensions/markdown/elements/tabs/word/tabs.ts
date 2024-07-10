import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { WordBlockChild } from "@ext/wordExport/options/WordTypes";
import {
	WordBlockType,
	wordBordersType,
	WordFontStyles,
	wordMarginsType,
} from "@ext/wordExport/options/wordExportSettings";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import { createParagraph } from "@ext/wordExport/createParagraph";
import { Table, TableCell, TableRow, WidthType } from "docx";

export const tabsWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	const rows = await Promise.all(
		tag.children.map(async (tab) => {
			const tabTag = tab as Tag;
			const paragraphs = [
				createParagraph([createContent(tabTag.attributes.name, addOptions)], WordFontStyles.tabsTitle),
				...(
					await Promise.all(tabTag.children.map((child) => state.renderBlock(child as Tag, addOptions)))
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
			width: { size: 100, type: WidthType.PERCENTAGE },
			borders: wordBordersType[WordBlockType.tabs],
			margins: wordMarginsType[WordBlockType.tabs],
			style: WordBlockType.tabs,
		}),
	];
};
