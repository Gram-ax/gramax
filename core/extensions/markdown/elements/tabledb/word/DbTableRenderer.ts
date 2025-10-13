import { Field } from "../../../../../logic/components/tableDB/table";
import { AddOptionsWord } from "../../../../wordExport/options/WordTypes";
import type { IRunOptions } from "docx";
import docx from "@dynamicImports/docx";
import { Table as TableDB } from "../../../../../logic/components/tableDB/table";
import {
	wordFontSizes,
	WordFontStyles,
	getHeadingStyles,
	wordMarginsType,
	WordBlockType,
	WordFontColors,
	NON_BREAKING_SPACE,
} from "../../../../wordExport/options/wordExportSettings";
import { createParagraph } from "@ext/wordExport/createParagraph";
import { createContent } from "@ext/wordExport/TextWordGenerator";

export class DbTableRenderer {
	private readonly _defaultWidths = [2500, 2000, 2000];

	async renderDbTable(table: TableDB) {
		const { Table } = await docx();
		const headingStyles = await getHeadingStyles();
		return [
			await createParagraph(
				[
					await createContent(NON_BREAKING_SPACE + table.code + NON_BREAKING_SPACE, {
						size: wordFontSizes.tableDBHeading[3] - 4,
						style: WordFontStyles.code,
					}),
					...(table.title.default ? [await createContent(NON_BREAKING_SPACE + table.title.default)] : []),
				],
				headingStyles[3],
			),
			...(table.subtitle
				? [await createParagraph([await createContent(table.subtitle)], WordFontStyles.normal)]
				: []),
			new Table({
				rows: [await this._createFirstRow(), ...(await this._createOtherRows(table))],
				margins: wordMarginsType[WordBlockType.table],
				columnWidths: this._defaultWidths,
			}),
		];
	}

	private async _createOtherRows(table: TableDB) {
		const { TableRow } = await docx();
		return await table.fields.mapAsync(async (field) => {
			const [c1, c2, c3] = await Promise.all([
				this._createFirstCell(field, { style: WordFontStyles.code }),
				this._createSecondCell(field, { style: WordFontStyles.code }),
				this._createThirdCell(field),
			]);
			return new TableRow({ children: [c1, c2, c3] });
		});
	}

	private async _createFirstRow() {
		const { TableRow, TableCell } = await docx();
		const cells = await ["field", "type", "description"].mapAsync(
			async (text) =>
				new TableCell({
					children: [await createParagraph([await createContent(text)], WordFontStyles.tableTitle)],
				}),
		);

		return new TableRow({ children: cells });
	}

	private async _createFirstCell(field: Field, addOptions: IRunOptions) {
		const { TableCell, WidthType } = await docx();
		const texts = [
			await createContent(
				NON_BREAKING_SPACE + field.code + (field.nullable ? NON_BREAKING_SPACE : ""),
				addOptions as AddOptionsWord,
			),
			...(field.nullable
				? []
				: [
						await createContent(NON_BREAKING_SPACE + "*" + NON_BREAKING_SPACE, {
							...addOptions,
							color: WordFontColors.dontNullableTypeTableDB,
						} as AddOptionsWord),
				  ]),
			await createContent(NON_BREAKING_SPACE),
			field.primary
				? await createContent(NON_BREAKING_SPACE + "PK" + NON_BREAKING_SPACE, addOptions as AddOptionsWord)
				: undefined,
		].filter((val) => val);

		return new TableCell({
			children: [
				await createParagraph(texts, WordFontStyles.normal),
				...(field.refObject
					? [
							await createParagraph(
								[
									await createContent("→" + NON_BREAKING_SPACE),
									await createContent(
										NON_BREAKING_SPACE + (field.refObject || "") + NON_BREAKING_SPACE,
										addOptions as AddOptionsWord,
									),
								],
								WordFontStyles.normal,
							),
					  ]
					: []),
			],
			width: {
				size: this._defaultWidths[0],
				type: WidthType.DXA,
			},
		});
	}

	private async _createSecondCell(field: Field, addOptions: IRunOptions) {
		const { TableCell, WidthType } = await docx();
		return new TableCell({
			children: [
				await createParagraph(
					[
						await createContent(
							NON_BREAKING_SPACE + (field.sqlType ?? "") + NON_BREAKING_SPACE,
							addOptions as AddOptionsWord,
						),
					],
					WordFontStyles.normal,
				),
			],
			width: {
				size: this._defaultWidths[1],
				type: WidthType.DXA,
			},
		});
	}

	private async _createThirdCell(field: Field) {
		const { TableCell, WidthType } = await docx();
		return new TableCell({
			children: [
				await createParagraph(
					[
						...(field.title.default ? [await createContent(field.title.default)] : []),
						...(field.title.default && field.description.default
							? [await createContent("", { break: 1 })]
							: []),
						...(field.description.default ? [await createContent(field.description.default)] : []),
					],
					WordFontStyles.normal,
				),
			],
			width: {
				size: this._defaultWidths[2],
				type: WidthType.DXA,
			},
		});
	}
}
