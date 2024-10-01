import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { createParagraphAfterTable } from "@ext/wordExport/createParagraph";
import {
	STANDARD_PAGE_WIDTH,
	WordBlockType,
	wordBordersType,
	wordMarginsType,
} from "@ext/wordExport/options/wordExportSettings";
import { AddOptionsWord } from "@ext/wordExport/options/WordTypes";
import { WordSerializerState } from "@ext/wordExport/WordExportState";
import { Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { FileChild } from "docx/build/file/file-child";

const INNER_BLOCK_WIDTH_DIFFERENCE = 700;

export const createBlock = async (
	state: WordSerializerState,
	tag: Tag,
	addOptions: AddOptionsWord,
	blockType: WordBlockType,
	style: string,
) => {
	const maxWidth = (addOptions?.maxTableWidth ?? STANDARD_PAGE_WIDTH) - INNER_BLOCK_WIDTH_DIFFERENCE;

	const fileChildren = [
		await createBlockTitle(tag, blockType),
		...(
			await Promise.all(
				tag.children
					.filter((child) => child instanceof Tag)
					.map((child) =>
						state.renderBlock(child, {
							...addOptions,
							maxTableWidth: maxWidth,
							maxPictureWidth: maxWidth,
						}),
					),
			)
		).flat(),
	] as FileChild[];

	return [await createBlockChild(fileChildren, blockType, style, addOptions), createParagraphAfterTable()];
};

export const createBlockChild = async (
	fileChildren: FileChild[],
	blockType: WordBlockType,
	style: string,
	addOptions: AddOptionsWord,
) => {
	const width = {
		size: addOptions?.maxTableWidth ?? STANDARD_PAGE_WIDTH,
		type: WidthType.DXA,
	};
	const cell = new TableCell({ children: fileChildren, borders: wordBordersType[blockType], width });
	const rows = [new TableRow({ children: [cell] })];

	return Promise.resolve(new Table({ rows, columnWidths: [width.size], margins: wordMarginsType[blockType], style }));
};

export const createBlockTitle = async (tag: Tag, blockType: WordBlockType) => {
	const title = (tag.attributes?.title as string) ?? (tag.attributes?.text as string);
	if (!title) return Promise.resolve({});

	return new Paragraph({ children: [new TextRun({ text: title })], style: blockType });
};
