import docx from "@dynamicImports/docx";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import type { AddOptionsWord } from "@ext/wordExport/options/WordTypes";
import {
	getWordBordersType,
	STANDARD_PAGE_WIDTH,
	type WordBlockType,
	wordMarginsType,
} from "@ext/wordExport/options/wordExportSettings";
import type { FileChild } from "@ext/wordExport/types";
import { markTableAsListContinuation } from "@ext/wordExport/utils/listContinuation";
import type { WordSerializerState } from "@ext/wordExport/WordExportState";
import type { JSONContent } from "@tiptap/core";

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

	const blockChild = await createBlockChild(fileChildren, blockType, style, addOptions);
	return [blockChild];
};

export const createBlockChild = async (
	fileChildren: FileChild[],
	blockType: WordBlockType,
	style: string,
	addOptions: AddOptionsWord,
) => {
	const { Table, TableCell, TableRow, WidthType } = await docx();
	const wordBordersType = await getWordBordersType();
	const width = {
		size: addOptions?.maxTableWidth ?? STANDARD_PAGE_WIDTH,
		type: WidthType.DXA,
	};
	const cell = new TableCell({ children: fileChildren, borders: wordBordersType[blockType], width });
	const rows = [new TableRow({ children: [cell] })];
	const indent =
		typeof addOptions?.indent === "number" ? { size: addOptions.indent, type: WidthType.DXA } : undefined;

	const table = new Table({
		rows,
		columnWidths: [width.size],
		margins: wordMarginsType[blockType],
		style,
		indent,
	});

	if (addOptions?.listContinuation) {
		await markTableAsListContinuation(table, addOptions.listContinuationLevel);
	}

	return table;
};

export const createBlockTitle = async (tag: Tag | JSONContent, blockType: WordBlockType) => {
	const { Paragraph, TextRun } = await docx();
	const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
	const title = (attrs?.title as string) ?? (attrs?.text as string);
	if (!title) return Promise.resolve({});

	return new Paragraph({ children: [new TextRun({ text: title })], style: blockType });
};
