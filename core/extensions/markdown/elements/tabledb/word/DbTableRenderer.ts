import { Field } from "../../../../../logic/components/tableDB/table";
import { AddOptionsWord } from "../../../../wordExport/options/WordTypes";
import { IRunOptions, Table, TableCell, TableRow } from "docx";
import { Table as TableDB } from "../../../../../logic/components/tableDB/table";
import {
	wordFontSizes,
	WordFontStyles,
	HeadingStyles,
	wordMarginsType,
	WordBlockType,
	WordFontColors,
	NON_BREAKING_SPACE,
} from "../../../../wordExport/options/wordExportSettings";
import { createParagraph } from "@ext/wordExport/createParagraph";
import { createContent } from "@ext/wordExport/TextWordGenerator";

export class DbTableRenderer {
	static renderDbTable(table: TableDB) {
		return [
			createParagraph(
				[
					createContent(NON_BREAKING_SPACE + table.code + NON_BREAKING_SPACE, {
						size: wordFontSizes.tableDBHeading[3] - 4,
						style: WordFontStyles.code,
					}),
					...(table.title.default ? [createContent(NON_BREAKING_SPACE + table.title.default)] : []),
				],
				HeadingStyles[3],
			),
			...(table.subtitle ? [createParagraph([createContent(table.subtitle)], WordFontStyles.normal)] : []),
			new Table({
				rows: [DbTableRenderer.createFirstRow(), ...DbTableRenderer.createOtherRows(table)],
				margins: wordMarginsType[WordBlockType.table],
			}),
		];
	}

	static createOtherRows(table: TableDB) {
		return [
			...table.fields.map(
				(field) =>
					new TableRow({
						children: [
							DbTableRenderer.createFirstCell(field, { style: WordFontStyles.code }),
							DbTableRenderer.createSecondCell(field, { style: WordFontStyles.code }),
							DbTableRenderer.createThirdCell(field),
						],
					}),
			),
		];
	}

	static createFirstRow() {
		const cells = ["field", "type", "description"].map(
			(text) =>
				new TableCell({
					children: [createParagraph([createContent(text)], WordFontStyles.tableTitle)],
				}),
		);

		return new TableRow({ children: cells });
	}

	static createFirstCell(field: Field, addOptions: IRunOptions) {
		const texts = [
			createContent(
				NON_BREAKING_SPACE + field.code + (field.nullable ? NON_BREAKING_SPACE : ""),
				addOptions as AddOptionsWord,
			),
			...(field.nullable
				? []
				: [
						createContent(NON_BREAKING_SPACE + "*" + NON_BREAKING_SPACE, {
							...addOptions,
							color: WordFontColors.dontNullableTypeTableDB,
						} as AddOptionsWord),
				  ]),
			createContent(NON_BREAKING_SPACE),
			field.primary
				? createContent(NON_BREAKING_SPACE + "PK" + NON_BREAKING_SPACE, addOptions as AddOptionsWord)
				: undefined,
		].filter((val) => val);

		return new TableCell({
			children: [
				createParagraph(texts, WordFontStyles.normal),
				...(field.refObject
					? [
							createParagraph(
								[
									createContent("→" + NON_BREAKING_SPACE),
									createContent(
										NON_BREAKING_SPACE + (field.refObject || "") + NON_BREAKING_SPACE,
										addOptions as AddOptionsWord,
									),
								],
								WordFontStyles.normal,
							),
					  ]
					: []),
			],
		});
	}

	static createSecondCell(field: Field, addOptions: IRunOptions) {
		return new TableCell({
			children: [
				createParagraph(
					[
						createContent(
							NON_BREAKING_SPACE + field.sqlType ? field.sqlType : "" + NON_BREAKING_SPACE,
							addOptions as AddOptionsWord,
						),
					],
					WordFontStyles.normal,
				),
			],
		});
	}

	static createThirdCell(field: Field) {
		return new TableCell({
			children: [
				createParagraph(
					[
						...(field.title.default ? [createContent(field.title.default)] : []),
						...(field.title.default && field.description.default ? [createContent("", { break: 1 })] : []),
						...(field.description.default ? [createContent(field.description.default)] : []),
					],
					WordFontStyles.normal,
				),
			],
		});
	}
}
