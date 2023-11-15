import { ITableRowPropertiesOptions, Table, TableCell, TableRow } from "docx";
import { FileChild } from "docx/build/file/file-child";
import { WordSerializerState } from "@ext/wordExport/WordExportState";
import { TableAddOptionsWord, WordTableChilds } from "./WordTableExportTypes";
import { getTableChilds } from "./getTableChilds";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";

const fifthOfMmInMarginUnits = 110;

export class WordTableExport {
	constructor(
		private _tableConfig: WordTableChilds,
		private _wordSerializerState: WordSerializerState,
	) {}

	async renderCellContent(tag: Tag): Promise<FileChild[]> {
		return await this._wordSerializerState.renderBlock(tag, { ...tag.attributes, removeWhiteSpace: true });
	}

	async renderCell(parent: Tag): Promise<TableCell> {
		return new TableCell({
			children: (
				await Promise.all(
					parent.children.map(async (child) => {
						if (!child || typeof child === "string") return;

						return await this.renderCellContent(child);
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
						new WordTableExport(getTableChilds(), this._wordSerializerState),
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
						new WordTableExport(getTableChilds(), this._wordSerializerState),
						addOptions,
					);
				}),
			)
		)
			.flat()
			.filter((val) => val);
	}

	static async renderTable(state: WordSerializerState, parent: Tag) {
		const tableChilds = getTableChilds();
		return new Table({
			rows: (
				await Promise.all(
					parent.children.map(async (child) => {
						if (!child || typeof child === "string") return;
						return await tableChilds[child.name]?.(
							state,
							child,
							new WordTableExport(getTableChilds(), state),
							{ removeWhiteSpace: true },
						);
					}),
				)
			)
				.flat()
				.filter((val) => val),
			margins: {
				left: fifthOfMmInMarginUnits,
				right: fifthOfMmInMarginUnits,
				bottom: fifthOfMmInMarginUnits,
			},
		});
	}
}
