import { Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { WordBlockType, wordMarginsType, wordBordersType } from "@ext/wordExport/options/wordExportSettings";
import { FileChild } from "docx/build/file/file-child";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { createParagraphAfterTable } from "@ext/wordExport/createParagraph";
import { AddOptionsWord } from "@ext/wordExport/options/WordTypes";
import { WordSerializerState } from "@ext/wordExport/WordExportState";

export const createBlock = async (
	state: WordSerializerState,
	tag: Tag,
	addOptions: AddOptionsWord,
	blockType: WordBlockType,
	style: string,
) => {
	const fileChildren = [
		await createBlockTitle(tag, blockType),
		...(
			await Promise.all(
				tag.children
					.filter((child) => child instanceof Tag)
					.map((child) => state.renderBlock(child as Tag, addOptions)),
			)
		).flat(),
	] as FileChild[];

	return [await createBlockChild(fileChildren, blockType, style), createParagraphAfterTable()];
};

export const createBlockChild = async (fileChildren: FileChild[], blockType: WordBlockType, style: string) => {
	const cell = new TableCell({ children: fileChildren, borders: wordBordersType[blockType] });
	const rows = [new TableRow({ children: [cell] })];
	const width = { size: 100, type: WidthType.PERCENTAGE };

	return Promise.resolve(new Table({ rows, width, margins: wordMarginsType[blockType], style }));
};

export const createBlockTitle = async (tag: Tag, blockType: WordBlockType) => {
	const title = (tag.attributes?.title as string)?.toUpperCase() ?? (tag.attributes?.text as string)?.toUpperCase();
	if (!title) return Promise.resolve({});

	return new Paragraph({ children: [new TextRun({ text: title })], style: blockType });
};
