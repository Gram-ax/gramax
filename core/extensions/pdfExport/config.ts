import { Alignment, Margins, Style } from "pdfmake/interfaces";

export const BASE_CONFIG = {
	FONT_SIZE: 16,
	LINE_HEIGHT: 1.4,
	LINE_HEIGHT_MARGIN: 1.4 * 3.57,
};

export const ICON_SIZE = 11;

export const MAX_WIDTH = 515;
export const MAX_HEIGTH = 800;
export const IMAGE_SCALE_FACTOR = 0.75;

export const FONT_SIZE_COEFFICIENT = 0.625;
export const LEVEL_WIDTH_REDUCTION = 25;
export const SCALE = 4;

export const ZERO_WIDTH_SPACE = "\u200B";

export const FONTS = {
	Roboto: {
		normal: "Roboto-Light.ttf",
		bold: "Roboto-Medium.ttf",
		italics: "Roboto-LightItalic.ttf",
		bolditalics: "Roboto-Italic.ttf",
	},
	RobotoRegular: {
		normal: "Roboto-Regular.ttf",
		bold: "Roboto-Medium.ttf",
		italics: "Roboto-LightItalic.ttf",
		bolditalics: "Roboto-Italic.ttf",
	},
	RobotoBold: {
		normal: "Roboto-Bold.ttf",
	},
	Menlo: {
		normal: "Menlo-Regular.ttf",
		bold: "Menlo-Regular.ttf",
	},
};

export const FONT_FILES = [
	"Roboto-Light.ttf",
	"Roboto-Medium.ttf",
	"Roboto-LightItalic.ttf",
	"Roboto-Italic.ttf",
	"Roboto-Regular.ttf",
	"Roboto-Bold.ttf",
	"Menlo-Regular.ttf",
];

export const FOOTER_CONFIG = {
	MARGIN: [0, 0, 0, 10] as Margins,
	COLUMNS: {
		LEFT: {
			alignment: "left" as Alignment,
			fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
			margin: [20, 10, 0, 0] as Margins,
		},
		RIGHT: {
			alignment: "right" as Alignment,
			fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
			margin: [0, 10, 20, 0] as Margins,
		},
	},
};

export const COLOR_CONFIG = {
	black: "#000000",
	table: "#a4a4a4",
	codeBlock: {
		fillColor: "#ededed",
		textColor: "#111111",
	},
	hr: {
		lineColor: "#a4a4a4",
	},
	video: {
		linkColor: "#126199",
	},
	link: "#126199",
	alfa: "#FF0000",
	beta: "#B8860B",
	who: "#ededed",
};

export const STYLES: Record<string, Style> = {
	H1: {
		fontSize: BASE_CONFIG.FONT_SIZE * 1.5625,
		font: "RobotoBold",
	},
	H2: {
		fontSize: BASE_CONFIG.FONT_SIZE * 1.25,
		font: "RobotoRegular",
	},
	H3: {
		fontSize: BASE_CONFIG.FONT_SIZE,
		font: "RobotoRegular",
	},
	H4: {
		fontSize: BASE_CONFIG.FONT_SIZE * 0.875,
		font: "RobotoRegular",
	},
	CODE: {
		background: COLOR_CONFIG.codeBlock.fillColor,
		font: "Menlo",
		color: COLOR_CONFIG.codeBlock.textColor,
	},
};

export const HEADING_MARGINS = {
	H1: { bottom: BASE_CONFIG.FONT_SIZE * 1.5625 },
	H2: {
		top: BASE_CONFIG.FONT_SIZE * 1.5625,
		bottom: BASE_CONFIG.FONT_SIZE * 1.125,
	},
	H3: {
		top: BASE_CONFIG.FONT_SIZE * 1.375,
		bottom: BASE_CONFIG.FONT_SIZE,
	},
	H4: {
		top: BASE_CONFIG.FONT_SIZE * 1.25,
		bottom: BASE_CONFIG.FONT_SIZE * 0.9375,
	},
};

export const NOT_FOUND_IMAGE = "data:text/html;base64,";

export const NOTE_COLOR_CONFIG = {
	borderColors: {
		tip: "#00aaff",
		danger: "#ff8080",
		note: "#ec980c",
		quote: "#7b7b7b",
		lab: "#8f7ee7",
		info: "#4366ad",
		hotfixes: "#7b7b7b",
	},
	bgColors: {
		tip: "#ecf4f9",
		danger: "#ffebeb",
		note: "#fff6e7",
		lab: "#f3f0ff",
		info: "#e6eeff",
		hotfixes: "#f4f4f4",
		quote: "#f4f4f4",
	},
};

export const TABLE_STYLE = {
	hLineWidth: (rowIndex, _node) =>
		rowIndex === 0 || (_node.table.body && rowIndex === _node.table.body.length) ? 0 : 0.1,
	vLineWidth: (colIndex, _node) =>
		colIndex === 0 || (_node.table.widths && colIndex === _node.table.widths.length) ? 0 : 0.1,
	hLineColor: () => COLOR_CONFIG.table,
	vLineColor: () => COLOR_CONFIG.table,
	paddingLeft: () => 4,
	paddingRight: () => 4,
	paddingTop: () => 8,
	paddingBottom: () => 8,
};
