import { COLOR_CONFIG } from "@ext/pdfExport/config";
import { ContentCanvas } from "pdfmake/interfaces";

export function hrHandler(): ContentCanvas {
	return {
		canvas: [
			{
				type: "line",
				x1: 0,
				y1: 0,
				x2: 515.28,
				y2: 0,
				lineWidth: 1,
				lineColor: COLOR_CONFIG.hr.lineColor,
			},
		],
	};
}
