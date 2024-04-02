import {
	IParagraphOptions,
	IParagraphPropertiesOptions,
	IRunOptions,
	Paragraph,
	Table,
	TableCell,
	TableRow,
	TextRun,
} from "docx";
import { Table as TableDB } from "../../../../../logic/components/tableDB/table";
import { wordFontSizes, wordIndentSizes } from "../../../../wordExport/wordExportSettings";
import { wordExportColors } from "@ext/wordExport/wordExportSettings";

export class TableDbRenderer {
	static renderDbTable(table: TableDB) {
		return [
			this._getParagraph({
				children: [
					...this._getTextRun(table.code, {
						bold: true,
						size: wordFontSizes.heading[3],
						highlight: wordExportColors.codeBlocks,
					}),
					...(table.title.default
						? this._getTextRun("	" + table.title.default, {
								bold: true,
								size: wordFontSizes.heading[3],
						  })
						: []),
				],
			}),
			...(table.subtitle ? [this._getParagraphWithTextRun(table.subtitle)] : []),
			new Table({
				rows: [
					new TableRow({
						children: [
							this._getTableCell([this._getParagraphWithTextRun("field")]),
							this._getTableCell([this._getParagraphWithTextRun("type")]),
							this._getTableCell([this._getParagraphWithTextRun("description")]),
						],
					}),
					...table.fields.map(
						(field) =>
							new TableRow({
								children: [
									this._getTableCell([
										this._getParagraphWithTextRun(
											field.code + (field.nullable ? "" : " *") + (field.primary ? " PK" : ""),
										),
										...(field.refObject
											? [
													this._getParagraphWithTextRun("→ " + field.refObject, {
														indent: { firstLine: wordIndentSizes.refObject },
													}),
											  ]
											: []),
									]),
									this._getTableCell([this._getParagraphWithTextRun(field.sqlType)]),
									this._getTableCell([
										this._getParagraph({
											children: [
												...(field.title.default ? this._getTextRun(field.title.default) : []),
												...(field.title.default && field.description.default
													? this._getTextRun("", { break: 1 })
													: []),
												...(field.description.default
													? this._getTextRun(field.description.default)
													: []),
											],
										}),
									]),
								],
							}),
					),
				],
			}),
		];
	}

	private static _getTableCell(children: Paragraph[]) {
		return new TableCell({ children });
	}

	private static _getParagraphWithTextRun(
		text: string,
		paragraphAddOptions?: IParagraphPropertiesOptions,
		textAddOptions?: IRunOptions,
	) {
		return this._getParagraph({
			children: this._getTextRun(text, textAddOptions),
			...paragraphAddOptions,
		});
	}

	private static _getParagraph(paragraphOptions: IParagraphOptions) {
		return new Paragraph(paragraphOptions);
	}

	private static _getTextRun(text: string, textAddOptions?: IRunOptions) {
		return [new TextRun({ text, ...textAddOptions })];
	}
}
