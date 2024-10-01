import { ITableRowPropertiesOptions, Table, TableCell, TableRow, WidthType } from "docx";
import { FileChild } from "docx/build/file/file-child";
import { WordSerializerState } from "@ext/wordExport/WordExportState";
import { TableAddOptionsWord, WordTableChildren } from "./WordTableExportTypes";
import { tableLayout } from "./getTableChilds";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import {
	STANDARD_PAGE_WIDTH,
	WordBlockType,
	wordBordersType,
	WordFontStyles,
	wordMarginsType,
} from "@ext/wordExport/options/wordExportSettings";
import { AddOptionsWord } from "@ext/wordExport/options/WordTypes";

export class WordTableExport {
	public static readonly defaultWidth = 2000;
	public static readonly defaultWidthCoefficient = 15;
	public static readonly innerBlockWidthDifference = 470;

	private _addOptions: AddOptionsWord;
	private _sumColumnsWidth = 0;
	private _tableConfig: WordTableChildren = tableLayout;

	constructor(private _wordSerializerState: WordSerializerState) {}

	async renderCellContent(tag: Tag, isTableHeader: boolean, maxWidth: number): Promise<FileChild[]> {
		return this._wordSerializerState.renderBlock(tag, {
			...tag.attributes,
			removeWhiteSpace: true,
			style: isTableHeader ? WordFontStyles.tableTitle : WordFontStyles.normal,
			bold: isTableHeader,
			maxPictureWidth: maxWidth / WordTableExport.defaultWidthCoefficient,
			maxTableWidth: maxWidth,
		});
	}

	async renderCell(parent: Tag, isTableHeader = false): Promise<TableCell> {
		const size = this._getCellWidth(
			parent.attributes.colwidth
				? parent.attributes.colwidth[0] * WordTableExport.defaultWidthCoefficient
				: WordTableExport.defaultWidth,
			this._getCellContractionCoefficient(this._sumColumnsWidth),
		);

		return new TableCell({
			children: (
				await Promise.all(
					parent.children.map(async (child) => {
						if (!child || typeof child === "string") return;
						return await this.renderCellContent(
							child,
							isTableHeader,
							size - WordTableExport.innerBlockWidthDifference,
						);
					}),
				)
			)
				.flat()
				.filter((val) => val),
			...(parent.attributes.colspan ? { columnSpan: parent.attributes.colspan } : []),
			...(parent.attributes.rowspan ? { rowSpan: parent.attributes.rowspan } : []),
			width: { size, type: WidthType.DXA },
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

	async renderTable(state: WordSerializerState, parent: Tag, addOptions: AddOptionsWord) {
		this._addOptions = addOptions;
		return new Table({
			rows: (await Promise.all(this._getParentChildrenMap(state, parent))).flat().filter((val) => val),
			margins: wordMarginsType[WordBlockType.table],
			borders: wordBordersType[WordBlockType.table],
			columnWidths: this._getColumnWidths(parent),
		});
	}

	private _getParentChildrenMap(state: WordSerializerState, parent: Tag) {
		return parent.children.map((child) =>
			child && typeof child !== "string"
				? tableLayout[child.name]?.(state, child, new WordTableExport(state), { removeWhiteSpace: true })
				: [],
		);
	}

	private _getSumOfColumnWidth(parent: Tag) {
		let result = 0;
		const children = (parent.children[0] as Tag).children;

		for (const child of children) {
			if (child && typeof child !== "string") {
				for (const cell of child.children) {
					if (cell && typeof cell !== "string") {
						result += cell.attributes.colwidth
							? cell.attributes.colwidth[0] * WordTableExport.defaultWidthCoefficient
							: WordTableExport.defaultWidth;
					}
				}
				break;
			}
		}

		return result;
	}

	private _getCellContractionCoefficient(sum: number) {
		return sum > (this._addOptions?.maxTableWidth ?? STANDARD_PAGE_WIDTH)
			? (this._addOptions?.maxTableWidth ?? STANDARD_PAGE_WIDTH) / sum
			: 1;
	}

	private _getCellWidth(width: number, coefficient: number) {
		return width * coefficient;
	}

	private _getColumnWidths(parent: Tag) {
		const result = [];
		const children = (parent.children[0] as Tag).children;
		this._sumColumnsWidth = this._getSumOfColumnWidth(parent);
		const coefficient = this._getCellContractionCoefficient(this._sumColumnsWidth);

		for (const child of children) {
			if (child && typeof child !== "string") {
				for (const cell of child.children) {
					const width =
						cell && typeof cell !== "string" && cell.attributes.colwidth
							? cell.attributes.colwidth[0] * WordTableExport.defaultWidthCoefficient
							: WordTableExport.defaultWidth;

					result.push(this._getCellWidth(width, coefficient));
				}
				break;
			}
		}

		return result;
	}
}
