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
import { JSONContent } from "@tiptap/core";

export const createBlock = async (
	state: WordSerializerState,
	tag: Tag | JSONContent,
	addOptions: AddOptionsWord,
	blockType: WordBlockType,
	style: string,
) => {
	const children = "children" in tag ? tag.children : tag.content;
	const fileChildren = [
		await createBlockTitle(tag, blockType),
		...(
			await Promise.all(
				children
					.filter((child) => child instanceof Tag || "type" in child || "name" in child)
					.map((child) =>
						state.renderBlock(child, {
							...addOptions,
						}),
					),
			)
		).flat(),
	] as FileChild[];

	if (addOptions?.insideTableWrapper) return [await createBlockChild(fileChildren, blockType, style, addOptions)];

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
	const indent =
		typeof addOptions?.indent === "number" ? { size: addOptions.indent, type: WidthType.DXA } : undefined;

	return Promise.resolve(
		new Table({
			rows,
			columnWidths: [width.size],
			margins: wordMarginsType[blockType],
			style,
			indent,
		}),
	);
};

export const createBlockTitle = async (tag: Tag | JSONContent, blockType: WordBlockType) => {
	const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
	const title = (attrs?.title as string) ?? (attrs?.text as string);
	if (!title) return Promise.resolve({});

	return new Paragraph({ children: [new TextRun({ text: title })], style: blockType });
};
