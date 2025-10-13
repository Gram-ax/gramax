import { ContentTable } from "pdfmake/interfaces";
import { getSvgIconFromString } from "@ext/pdfExport/utils/getIcon";
import { BASE_CONFIG } from "@ext/pdfExport/config";
import t from "@ext/localization/locale/translate";

export async function errorCase(): Promise<ContentTable> {
	const icon = await getSvgIconFromString("circle-alert", "#ba1c1c");
	return {
		table: {
			dontBreakRows: true,
			widths: ["*"],
			body: [
				[
					{
						margin: [
							BASE_CONFIG.FONT_SIZE * 0.75,
							BASE_CONFIG.FONT_SIZE * 0.75,
							BASE_CONFIG.FONT_SIZE * 0.75,
							BASE_CONFIG.FONT_SIZE * 0.75 - BASE_CONFIG.LINE_HEIGHT_MARGIN,
						],
						fillColor: "#ffebeb",
						border: [true, true, true, true],
						borderColor: ["#ffc7c7", "#ffc7c7", "#ffc7c7", "#ffc7c7"],
						stack: [
							{
								columns: [
									{
										svg: icon,
										width: BASE_CONFIG.FONT_SIZE * 0.875,
										height: BASE_CONFIG.FONT_SIZE * 0.875,
									},
									{
										text: t("pdf.component-parsing-failed"),
										lineHeight: BASE_CONFIG.LINE_HEIGHT,
										fontSize: BASE_CONFIG.FONT_SIZE * 0.75,
										bold: true,
										color: "#ba1c1c",
										margin: [BASE_CONFIG.FONT_SIZE * 0.5, 0, 0, 0],
									},
								],
							},
						],
					},
				],
			],
		},
		margin: [0, 0, 0, BASE_CONFIG.FONT_SIZE * 0.5],
	};
}
