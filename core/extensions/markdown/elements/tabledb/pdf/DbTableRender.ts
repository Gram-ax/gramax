import t from "@ext/localization/locale/translate";
import { BASE_CONFIG, COLOR_CONFIG, FONT_SIZE_COEFFICIENT, ICON_SIZE } from "@ext/pdfExport/config";
import { getSvgIconFromString } from "@ext/pdfExport/utils/getIcon";
import { Content } from "pdfmake/interfaces";
import { Field, Table as TableDB } from "../../../../../logic/components/tableDB/table";

export class DbTableRenderer {
	private readonly _defaultWidths = ["auto", "auto", "auto"];

	async renderDbTable(table: TableDB) {
		const content = [
			{
				table: {
					body: [
						[
							{
								table: {
									body: [
										[
											{
												svg: await getSvgIconFromString("table", COLOR_CONFIG.black, "1.3"),
												width: 14,
												height: 14,
												margin: [3, 1, 0, 0],
											},
											{
												text: table.code,
												style: "CODE",
												fontSize: BASE_CONFIG.FONT_SIZE * 0.875,
												margin: [-3, 0, 0, 0],
											},
										],
									],
									widths: ["auto", "*"],
								},
								layout: "noBorders",
								fillColor: COLOR_CONFIG.codeBlock.fillColor,
							},
							{
								text: table.title.default || "",
								style: "H3",
								width: "*",
							},
						],
					],
					widths: ["auto", "auto"],
				},
				layout: "noBorders",
			},
			{
				text: this.stripHtmlTags(table?.description?.default),
				fontSize: BASE_CONFIG.FONT_SIZE * 0.625,
				margin: [0, BASE_CONFIG.FONT_SIZE, 0, 0],
			},
			{
				table: {
					widths: this._defaultWidths,
					body: [this._createFirstRow(), ...(await this._createOtherRows(table))],
				},
				layout: {
					hLineWidth: (rowIndex, _node) =>
						rowIndex === 0 || (_node.table.body && rowIndex === _node.table.body.length) ? 0 : 0.1,
					vLineWidth: (colIndex, _node) =>
						colIndex === 0 || (_node.table.widths && colIndex === _node.table.widths.length) ? 0 : 0.1,
					hLineColor: () => COLOR_CONFIG.table,
					vLineColor: () => COLOR_CONFIG.table,
					paddingLeft: () => 8,
					paddingRight: () => 8,
					paddingTop: () => 10,
					paddingBottom: () => 10,
				},
				margin: [BASE_CONFIG.FONT_SIZE * 0.625, BASE_CONFIG.FONT_SIZE * 1.5625, 0, 0],
			},
		];

		return content;
	}

	private async _createOtherRows(table: TableDB) {
		return Promise.all(
			table.fields.map(async (field) => [
				await this._createFirstCell(field),
				this._createSecondCell(field),
				this._createThirdCell(field),
			]),
		);
	}

	private _createFirstRow() {
		return [
			{ text: t("field"), bold: true },
			{ text: t("type"), bold: true },
			{ text: t("description"), bold: true },
		];
	}

	private async _createFirstCell(field: Field) {
		const stack: Content[] = [];

		stack.push({
			table: {
				widths: ["auto", "auto", "auto"],
				body: [
					[
						{ text: field.code, style: "CODE" },
						field.nullable
							? { text: "", border: [false, false, false, false] }
							: { text: " *", color: COLOR_CONFIG.alfa, bold: true, margin: [-6, 0, 0, 0] },
						field.primary
							? {
									table: {
										widths: ["auto", "auto"],
										body: [
											[
												{
													svg: await getSvgIconFromString(
														"key-round",
														COLOR_CONFIG.black,
														"1.3",
													),
													width: ICON_SIZE,
													height: ICON_SIZE,
													margin: [0, 2, 0, 0],
													fillColor: COLOR_CONFIG.codeBlock.fillColor,
												},
												{
													text: "PK",
													style: "CODE",
													fontSize: BASE_CONFIG.FONT_SIZE * 0.75,
													margin: [-3, 0, 0, 0],
													fillColor: COLOR_CONFIG.codeBlock.fillColor,
												},
											],
										],
									},

									margin: [-8, -4, 0, 0],
									layout: "noBorders",
								}
							: { text: "", border: [false, false, false, false] },
					],
				],
			},
			layout: "noBorders",
			background: COLOR_CONFIG.codeBlock.fillColor,
		});

		if (field.refObject) {
			stack.push({
				table: {
					body: [
						[
							{
								svg: await getSvgIconFromString("arrow-right-to-line", COLOR_CONFIG.black, "1.3"),
								width: ICON_SIZE,
								height: ICON_SIZE,
								margin: [0, 2, 0, 3],
							},
							{
								table: {
									body: [
										[
											{
												svg: await getSvgIconFromString("table", COLOR_CONFIG.black, "1.3"),
												width: 10,
												height: 10,
												margin: [0, 2, 0, 0],
											},
											{
												text: field.refObject || " ",
												style: "CODE",
												margin: [-5, 0, 0, 0],
											},
										],
									],
									widths: ["auto", "*"],
								},
								fillColor: COLOR_CONFIG.codeBlock.fillColor,
								layout: "noBorders",
								margin: [0, 0, 2, 0],
							},
						],
					],
					widths: ["auto", "auto"],
				},
				layout: "noBorders",
				margin: [15, 8, 0, 0],
			});
		}

		return {
			stack: stack,
			fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
		};
	}

	private _createSecondCell(field: Field) {
		return {
			text: field.sqlType,
			style: "CODE",
			fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
		};
	}

	private _createThirdCell(field: Field) {
		const texts = [
			field.title.default,
			field.title.default && field.description.default ? "" : null,
			field.description.default ? this.stripHtmlTags(field.description.default) : null,
		].filter(Boolean);

		return {
			text: texts.length > 0 ? texts.join("\n") : field.refObject || "",
			fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
		};
	}

	private stripHtmlTags(html: string): string {
		return html.replace(/<[^>]*>/g, "");
	}
}
