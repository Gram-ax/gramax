import docx from "@dynamicImports/docx";
import type { ITableRowPropertiesOptions, TableRow, TableCell } from "docx";
import { FileChild } from "docx/build/file/file-child";
import { WordSerializerState } from "@ext/wordExport/WordExportState";
import { TableAddOptionsWord, WordTableChildren } from "./WordTableExportTypes";
import { tableLayout } from "./getTableChilds";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import {
	STANDARD_PAGE_WIDTH,
	WordBlockType,
	getWordBordersType,
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
	public static computedDefaultWidth?: number;

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
		const { TableCell, WidthType } = await docx();
		const size = this._getCellWidth(
			parent.attributes.colwidth
				? parent.attributes.colwidth[0] * WordTableExport.defaultWidthCoefficient
				: WordTableExport.computedDefaultWidth ?? WordTableExport.defaultWidth,
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
		const { TableRow } = await docx();
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
		const { Table, WidthType } = await docx();
		const wordBordersType = await getWordBordersType();
		const parent = JSON.parse(JSON.stringify(table));
		this._addOptions = addOptions;

		const columnWidths = this._getColumnWidths(parent);

		const children = "children" in parent ? parent.children : parent.content;
		const rows: (Tag | JSONContent)[] =
			children?.[0] && ("name" in children[0] && children ? children[0].children : children);
		const indent =
			typeof addOptions?.indent === "number" ? { size: addOptions.indent, type: WidthType.DXA } : undefined;
		aggregateTable(rows);
		setCellAlignment(rows);

		return new Table({
			rows: (await Promise.all(this._getParentChildrenMap(state, parent))).flat().filter((val) => val),
			margins: wordMarginsType[WordBlockType.table],
			borders: wordBordersType[WordBlockType.table],
			columnWidths,
			style: WordBlockType.table,
			indent,
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
							: WordTableExport.computedDefaultWidth ?? WordTableExport.defaultWidth;
					}
				}
				break;
			}
		}

		return result;
	}

	private _getColumnsCount(parent: Tag | JSONContent) {
		const tbody = "children" in parent ? parent.children : parent.content;
		const rows = tbody[0].children;
		let maxCols = 1;

		for (const row of rows) {
			if (!row || typeof row === "string") continue;
			const cells = row.children ?? [];
			let rowCols = 0;

			for (const cell of cells) {
				if (!cell || typeof cell === "string") continue;
				const cellAttributes = "attributes" in cell ? cell.attributes : cell.attrs;
				const spanRaw = cellAttributes?.colspan ?? 1;
				const span = Number.isFinite(Number(spanRaw)) && Number(spanRaw) > 0 ? Number(spanRaw) : 1;
				rowCols += span;
			}

			if (rowCols > 0) {
				maxCols = Math.max(maxCols, rowCols);
			}
		}

		return maxCols;
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

		const columnsCount = this._getColumnsCount(parent);
		const pageWidth = this._addOptions?.maxTableWidth ?? STANDARD_PAGE_WIDTH;
		WordTableExport.computedDefaultWidth = Math.floor(pageWidth / columnsCount);

		this._sumColumnsWidth = this._getSumOfColumnWidth(parent);
		const coefficient = this._getCellContractionCoefficient(this._sumColumnsWidth);

		for (const child of parentChildren) {
			if (child && typeof child !== "string") {
				for (const cell of child.children) {
					const cellAttributes = "attributes" in cell ? cell.attributes : cell.attrs;
					const width = cellAttributes.colwidth
						? cellAttributes.colwidth[0] * WordTableExport.defaultWidthCoefficient
						: WordTableExport.computedDefaultWidth;
					result.push(this._getCellWidth(width, coefficient));
				}
				break;
			}
		}

		return result;
	}
}
