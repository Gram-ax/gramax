import { BorderStyle } from "docx";

export const wordFontSizes = {
	normal: 24,
	heading: {
		1: 49,
		2: 38,
		3: 32,
		4: 27,
	},
	code: 20,
} as const;

export const wordFontTypes = {
	normal: "Roboto Light",
	heading: "Roboto",
	bold: "Roboto",
	code: "Roboto Mono",
};

export const enum ParagraphType {
	normal = "normal",
	headingOne = 1,
	headingTwo = 2,
	headingThree = 3,
	headingFour = 4,
	table = "table",
	list = "list",
	fence = "fence",
}

export const enum WordFontColors {
	fence = "323E4F",
}

export const enum TableType {
	table = "table",
	fence = "fence",
}

export const marginsType = {
	[TableType.table]: { top: 250, bottom: 110, left: 170, right: 170 },
	[TableType.fence]: { bottom: 300, top: 300 },
} as const;

export const wordBoardersType = {
	[TableType.table]: {
		top: { style: BorderStyle.SINGLE, color: "#a4a4a4", size: 10 },
		bottom: { style: BorderStyle.SINGLE, color: "#a4a4a4", size: 10 },
		left: { style: BorderStyle.SINGLE, color: "#a4a4a4", size: 10 },
		right: { style: BorderStyle.SINGLE, color: "#a4a4a4", size: 10 },
	},
	[TableType.fence]: {},
} as const;

export const levelSpacingConfig = {
	[ParagraphType.normal]: { line: 360.4, before: 0, after: 160 },
	[ParagraphType.headingOne]: { line: 360.4, before: 460, after: 60 },
	[ParagraphType.headingTwo]: { line: 360.4, before: 380, after: 80 },
	[ParagraphType.headingThree]: { line: 360.4, before: 300, after: 80 },
	[ParagraphType.headingFour]: { line: 360.4, before: 240, after: 80 },
	[ParagraphType.table]: { line: 360.4, before: 0, after: 0 },
	[ParagraphType.list]: { line: 420.5, before: 0, after: 0 },
	[ParagraphType.fence]: { line: 276, before: 0, after: 0 },
} as const;

export const wordIndentSizes = {
	note: "11mm",
	refObject: "6mm",
} as const;

export const wordExportColors = {
	codeBlocks: "lightGray",
} as const;
