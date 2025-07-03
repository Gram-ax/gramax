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
import { JSONContent } from "@tiptap/core";
import { AlignEnumTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { aggregateTable, setCellAlignment } from "@ext/markdown/elements/table/edit/logic/exportUtils";

export class WordTableExport {
	public static readonly defaultWidth = 2000;
	public static readonly defaultWidthCoefficient = 15;
	public static readonly innerBlockWidthDifference = 470;

	private _addOptions: AddOptionsWord;
	private _sumColumnsWidth = 0;
	private _tableConfig: WordTableChildren = tableLayout;

	constructor(private _wordSerializerState: WordSerializerState) {}

	async renderCellContent(
		tag: Tag | JSONContent,
		isTableHeader: boolean,
		maxWidth: number,
		align?: AlignEnumTypes,
	): Promise<FileChild[]> {
		return this._wordSerializerState.renderBlock(tag, {
			...tag.attributes,
			removeWhiteSpace: true,
			style: isTableHeader ? WordFontStyles.tableTitle : WordFontStyles.normal,
			bold: isTableHeader,
			maxPictureWidth: maxWidth / WordTableExport.defaultWidthCoefficient,
			maxTableWidth: maxWidth,
			alignment: align,
		});
	}

	async renderCell(parent: Tag | JSONContent, isTableHeader = false): Promise<TableCell> {
		const size = this._getCellWidth(
			parent.attributes.colwidth
				? parent.attributes.colwidth[0] * WordTableExport.defaultWidthCoefficient
				: WordTableExport.defaultWidth,
			this._getCellContractionCoefficient(this._sumColumnsWidth),
		);

		const parentChildren = "children" in parent ? parent.children : parent.content;
		const parentAttributes = "attributes" in parent ? parent.attributes : parent.attrs;
		return new TableCell({
			children: (
				await Promise.all(
					parentChildren.map(async (child) => {
						if (!child || typeof child === "string") return;
						return await this.renderCellContent(
							child,
							isTableHeader,
							size - WordTableExport.innerBlockWidthDifference,
							parentAttributes.align,
						);
					}),
				)
			)
				.flat()
				.filter((val) => val),
			...(parentAttributes.colspan ? { columnSpan: parentAttributes.colspan } : []),
			...(parentAttributes.rowspan ? { rowSpan: parentAttributes.rowspan } : []),
			width: { size, type: WidthType.DXA },
		});
	}

	async renderRowContent(parent: Tag | JSONContent): Promise<TableCell[]> {
		const parentChildren = "children" in parent ? parent.children : parent.content;
		return (
			await Promise.all(
				parentChildren.map(async (child) => {
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

	async renderRow(block: Tag | JSONContent, addOptions?: TableAddOptionsWord): Promise<TableRow> {
		return new TableRow({
			children: await this.renderRowContent(block),
			cantSplit: false,
			...(addOptions as ITableRowPropertiesOptions),
		});
	}

	async renderRows(parent: Tag | JSONContent, addOptions?: TableAddOptionsWord): Promise<TableRow[]> {
		const parentChildren = "children" in parent ? parent.children : parent.content;
		return (
			await Promise.all(
				parentChildren.map(async (child) => {
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

	async renderTable(state: WordSerializerState, table: Tag | JSONContent, addOptions: AddOptionsWord) {
		const parent = JSON.parse(JSON.stringify(table));
		this._addOptions = addOptions;

		const children = "children" in parent ? parent.children : parent.content;
		const rows: (Tag | JSONContent)[] =
			children?.[0] && ("name" in children[0] && children ? children[0].children : children);

		aggregateTable(rows);
		setCellAlignment(rows);

		return new Table({
			rows: (await Promise.all(this._getParentChildrenMap(state, parent))).flat().filter((val) => val),
			margins: wordMarginsType[WordBlockType.table],
			borders: wordBordersType[WordBlockType.table],
			columnWidths: this._getColumnWidths(parent),
		});
	}

	private _getParentChildrenMap(state: WordSerializerState, parent: Tag | JSONContent) {
		const parentChildren = "children" in parent ? parent.children : parent.content;
		return parentChildren.map((child) =>
			child && typeof child !== "string"
				? tableLayout[child.name]?.(state, child, new WordTableExport(state), { removeWhiteSpace: true })
				: [],
		);
	}

	private _getSumOfColumnWidth(parent: Tag | JSONContent) {
		let result = 0;
		const children = "children" in parent ? parent.children : parent.content;

		for (const child of children) {
			if (child && typeof child !== "string") {
				for (const cell of child.children) {
					if (cell && typeof cell !== "string") {
						const cellAttributes = "attributes" in cell ? cell.attributes : cell.attrs;
						result += cellAttributes.colwidth
							? cellAttributes.colwidth[0] * WordTableExport.defaultWidthCoefficient
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

	private _getColumnWidths(parent: Tag | JSONContent) {
		const result = [];
		const parentChildren = "children" in parent ? parent.children : parent.content;
		this._sumColumnsWidth = this._getSumOfColumnWidth(parent);
		const coefficient = this._getCellContractionCoefficient(this._sumColumnsWidth);

		for (const child of parentChildren) {
			if (child && typeof child !== "string") {
				for (const cell of child.children) {
					const cellAttributes = "attributes" in cell ? cell.attributes : cell.attrs;
					const width = cellAttributes.colwidth
						? cellAttributes.colwidth[0] * WordTableExport.defaultWidthCoefficient
						: WordTableExport.defaultWidth;

					result.push(this._getCellWidth(width, coefficient));
				}
				break;
			}
		}

		return result;
	}
}
