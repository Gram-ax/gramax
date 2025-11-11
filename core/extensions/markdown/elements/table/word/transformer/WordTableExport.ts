import docx from "@dynamicImports/docx";
import { ITableRowPropertiesOptions, TableRow, TableCell, ImportedXmlComponent } from "docx";
import { FileChild } from "docx/build/file/file-child";
import { WordSerializerState } from "@ext/wordExport/WordExportState";
import { TableAddOptionsWord, WordTableChildren } from "./WordTableExportTypes";
import { tableLayout } from "./getTableChilds";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { WordBlockType, getWordBordersType, wordMarginsType } from "@ext/wordExport/options/wordExportSettings";
import { AddOptionsWord } from "@ext/wordExport/options/WordTypes";
import { JSONContent } from "@tiptap/core";
import { AlignEnumTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { aggregateTable, setCellAlignment } from "@ext/markdown/elements/table/edit/logic/exportUtils";
import {
	TableWidthContext,
	TWIPS_PER_PIXEL,
	buildTableWidthContext,
	calculateCellBaseWidthTwips,
	getColumnWidthsTwips,
} from "./WordTableWidthCalculator";

type TableRenderEnvironment = {
	addOptions: AddOptionsWord;
	width: TableWidthContext;
};

export class WordTableExport {
	public static readonly innerBlockWidthDifference = 470;

	private _tableConfig: WordTableChildren = tableLayout;
	private _environment?: TableRenderEnvironment;

	constructor(private _wordSerializerState: WordSerializerState, environment?: TableRenderEnvironment) {
		this._environment = environment;
	}

	async renderCellContent(tag: Tag | JSONContent, maxWidth: number, align?: AlignEnumTypes): Promise<FileChild[]> {
		const safeWidth = Math.max(maxWidth, 0);
		const maxPictureWidth = WordTableExport._convertTwipsToPixels(safeWidth);
		return this._wordSerializerState.renderBlock(tag, {
			...tag.attributes,
			removeWhiteSpace: true,
			maxPictureWidth,
			maxTableWidth: safeWidth,
			alignment: align,
		});
	}

	async renderCell(parent: Tag | JSONContent): Promise<TableCell> {
		const env = this._requireEnvironment();
		const { TableCell, WidthType } = await docx();
		const parentAttributes = "attributes" in parent ? parent.attributes : parent.attrs;
		const baseWidth = calculateCellBaseWidthTwips(parentAttributes, env.width);
		const size = baseWidth * env.width.contractionCoefficient;

		const parentChildren = "children" in parent ? parent.children : parent.content;
		return new TableCell({
			children: (
				await Promise.all(
					parentChildren.map(async (child) => {
						if (!child || typeof child === "string") return;
						return await this.renderCellContent(
							child,
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
						this._createChildExport(),
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
						this._createChildExport(),
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

		const widthContext = buildTableWidthContext(parent, addOptions?.maxTableWidth);
		this._environment = { addOptions, width: widthContext };

		const columnWidths = getColumnWidthsTwips(widthContext);
		const children = "children" in parent ? parent.children : parent.content;
		const rows: (Tag | JSONContent)[] =
			children?.[0] && ("name" in children[0] && children ? children[0].children : children);
		const indent =
			typeof addOptions?.indent === "number" ? { size: addOptions.indent, type: WidthType.DXA } : undefined;

		aggregateTable(rows);
		setCellAlignment(rows);

		const t = new Table({
			rows: (await Promise.all(this._getParentChildrenMap(state, parent))).flat().filter((val) => val),
			margins: wordMarginsType[WordBlockType.table],
			borders: wordBordersType[WordBlockType.table],
			columnWidths,
			style: WordBlockType.table,
			indent,
		});

		const { hasHeaderRow, hasHeaderCol } = this._getHeaderType(table);

		this._injectTblLook(t, {
			firstRow: hasHeaderRow,
			firstColumn: hasHeaderCol,
			lastRow: false,
			lastColumn: false,
			bandedRows: false,
			bandedColumns: false,
		});

		return t;
	}

	private _getHeaderType(table: JSONContent): {
		hasHeaderRow: boolean;
		hasHeaderCol: boolean;
	} {
		try {
			const header = table.attrs.header;
			if (header === "row") {
				return { hasHeaderRow: true, hasHeaderCol: false };
			}
			if (header === "column") {
				return { hasHeaderRow: false, hasHeaderCol: true };
			}
			return { hasHeaderRow: false, hasHeaderCol: false };
		} catch {
			return { hasHeaderRow: false, hasHeaderCol: false };
		}
	}

	private _injectTblLook(
		table: any,
		opts: {
			firstRow?: boolean;
			firstColumn?: boolean;
			lastRow?: boolean;
			lastColumn?: boolean;
			bandedRows?: boolean;
			bandedColumns?: boolean;
		},
	) {
		const xml = `
		  <w:tblLook
			w:firstRow="${opts.firstRow ? 1 : 0}"
			w:lastRow="${opts.lastRow ? 1 : 0}"
			w:firstColumn="${opts.firstColumn ? 1 : 0}"
			w:lastColumn="${opts.lastColumn ? 1 : 0}"
			w:noHBand="${opts.bandedRows ? 0 : 1}"
			w:noVBand="${opts.bandedColumns ? 0 : 1}"/>`;

		const importedComp = ImportedXmlComponent.fromXmlString(xml);
		const tblLookComp = (importedComp as any)?.root?.[0];
		if (!tblLookComp) return;

		const rootArray = table?.root as any[] | undefined;
		if (!Array.isArray(rootArray)) return;

		let tblPrComp = rootArray.find((c: any) => c?.rootKey === "w:tblPr");

		if (!tblPrComp) {
			tblPrComp = new ImportedXmlComponent("w:tblPr");
			rootArray.unshift(tblPrComp);
		}

		const tblPrRoot = tblPrComp?.root;
		if (Array.isArray(tblPrRoot)) {
			for (let i = tblPrRoot.length - 1; i >= 0; i--) {
				if (tblPrRoot[i]?.rootKey === "w:tblLook") {
					tblPrRoot.splice(i, 1);
				}
			}
		}

		tblPrComp?.root.push(tblLookComp);
	}

	private _createChildExport() {
		return new WordTableExport(this._wordSerializerState, this._environment);
	}

	private _getParentChildrenMap(state: WordSerializerState, parent: Tag | JSONContent) {
		const parentChildren = "children" in parent ? parent.children : parent.content;
		return parentChildren.map((child) =>
			child && typeof child !== "string"
				? tableLayout[child.name]?.(state, child, this._createChildExport(), { removeWhiteSpace: true })
				: [],
		);
	}

	private _requireEnvironment(): TableRenderEnvironment {
		if (!this._environment) throw new Error("WordTableExport environment is not initialized");
		return this._environment;
	}

	private static _convertTwipsToPixels(width: number) {
		if (width <= 0) return 0;
		return Math.floor(width / TWIPS_PER_PIXEL);
	}
}
