import { ITableRowPropertiesOptions, Table, TableCell, TableRow } from "docx";
import { FileChild } from "docx/build/file/file-child";
import { WordSerializerState } from "@ext/wordExport/WordExportState";
import { TableAddOptionsWord, WordTableChilds } from "./WordTableExportTypes";
import { tableLayout } from "./getTableChilds";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import {
	WordBlockType,
	wordBordersType,
	WordFontStyles,
	wordMarginsType,
} from "@ext/wordExport/options/wordExportSettings";

export class WordTableExport {
	private _tableConfig: WordTableChilds = tableLayout;

	constructor(private _wordSerializerState: WordSerializerState) {}

	async renderCellContent(tag: Tag, isTableHeader: boolean): Promise<FileChild[]> {
		return this._wordSerializerState.renderBlock(tag, {
			...tag.attributes,
			removeWhiteSpace: true,
			style: isTableHeader ? WordFontStyles.tableTitle : WordFontStyles.normal,
			bold: isTableHeader,
		});
	}

	async renderCell(parent: Tag, isTableHeader = false): Promise<TableCell> {
		return new TableCell({
			children: (
				await Promise.all(
					parent.children.map(async (child) => {
						if (!child || typeof child === "string") return;
						return await this.renderCellContent(child, isTableHeader);
					}),
				)
			)
				.flat()
				.filter((val) => val),
			...(parent.attributes.colspan ? { columnSpan: parent.attributes.colspan } : []),
			...(parent.attributes.rowspan ? { rowSpan: parent.attributes.rowspan } : []),
		});
	}

	async renderRowContent(parent: Tag): Promise<TableCell[]> {
		return (
			await Promise.all(
				parent.children.map(async (child) => {
					if (!child || typeof child === "string") return;
					return await this._tableConfig[child.name]?.(
						this._wordSerializerState,
						child,
						new WordTableExport(this._wordSerializerState),
					);
				}),
			)
		).filter((val) => val);
	}

	async renderRow(block: Tag, addOptions?: TableAddOptionsWord): Promise<TableRow> {
		return new TableRow({
			children: await this.renderRowContent(block),
			cantSplit: false,
			...(addOptions as ITableRowPropertiesOptions),
		});
	}

	async renderRows(parent: Tag, addOptions?: TableAddOptionsWord): Promise<TableRow[]> {
		return (
			await Promise.all(
				parent.children.map(async (child) => {
					if (!child || typeof child === "string") return;

					return await this._tableConfig[child.name]?.(
						this._wordSerializerState,
						child,
						new WordTableExport(this._wordSerializerState),
						addOptions,
					);
				}),
			)
		)
			.flat()
			.filter((val) => val);
	}

	static async renderTable(state: WordSerializerState, parent: Tag) {
		return new Table({
			rows: (await Promise.all(this._getParentChildrenMap(state, parent))).flat().filter((val) => val),
			margins: wordMarginsType[WordBlockType.table],
			borders: wordBordersType[WordBlockType.table],
		});
	}

	private static _getParentChildrenMap(state: WordSerializerState, parent: Tag) {
		return parent.children.map((child) =>
			child && typeof child !== "string"
				? tableLayout[child.name]?.(state, child, new WordTableExport(state), { removeWhiteSpace: true })
				: [],
		);
	}
}
