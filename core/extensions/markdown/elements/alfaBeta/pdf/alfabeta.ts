import { BASE_CONFIG, COLOR_CONFIG, FONT_SIZE_COEFFICIENT } from "@ext/pdfExport/config";
import { ContentText } from "pdfmake/interfaces";

export const alfaHandler = (): ContentText[] => {
	return [
		{
			text: "αlfa",
			fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
			color: COLOR_CONFIG.alfa,
			lineHeight: BASE_CONFIG.LINE_HEIGHT,
		},
	];
};

export const betaHandler = (): ContentText[] => {
	return [
		{
			text: "βeta",
			fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
			color: COLOR_CONFIG.beta,
			lineHeight: BASE_CONFIG.LINE_HEIGHT,
		},
	];
};
