import Language from "@ext/localization/core/model/Language";
import useBareLocalize from "@ext/localization/useLocalize/useBareLocalize";
import { BorderStyle, HeadingLevel } from "docx";

export const NON_BREAKING_SPACE = "\u00A0";
export const ICON_SIZE = 11;

export const diagramString = (language: Language) => useBareLocalize("diagramWord", language);
export const imageString = (language: Language) => useBareLocalize("pictureWord", language);
export const tableDbString = (language: Language) => useBareLocalize("tableDbWord", language);
export const snippetString = (language: Language) => useBareLocalize("snippetWord", language);

export const wordFontSizes = {
	list: 24,
	tableDBHeading: { 3: 32 },
} as const;

export const HeadingStyles = {
	0: HeadingLevel.TITLE,
	1: HeadingLevel.HEADING_1,
	2: HeadingLevel.HEADING_2,
	3: HeadingLevel.HEADING_3,
	4: HeadingLevel.HEADING_4,
};

export const wordFontTypes = {
	numbering: "Roboto",
	bold: "Roboto",
} as const;

export const enum WordFontColors {
	whoWhen = "d0d0d0",
	dontNullableTypeTableDB = "d90000",
}

export enum WordFontStyles {
	code = "Code",
	strong = "Strong",
	tableTitle = "TableTitle",
	normal = "Normal",
	link = "Hyperlink",
	alfa = "Alfa",
	beta = "Beta",
	module = "Module",
	kbd = "Kbd",
	picture = "Picture",
	pictureTitle = "PictureTitle",
	videoTitle = "VideoTitle",
	error = "Error",
	button = "Button",
	issue = "Issue",
	listParagraph = "ListParagraph",
	term = "Term",
	who = "Who",
	when = "When",
	horizontalLine = "HorizontalLine",
	notExportBeforeTable = "NotExportBeforeTable",
	notExportAfterTable = "NotExportAfterTable",
	emphasis = "Emphasis",
	bookTitle = "BookTitle",
	tabsTitle = "TabsTitle",
	tableOfContents = "TableOfContent",
}

export const enum WordBlockType {
	table = "table",
	fence = "Fence",
	fenceTable = "FenceTable",
	note = "NoteTitle",
	lab = "LabTitle",
	tip = "TipTitle",
	info = "InfoTitle",
	danger = "DangerTitle",
	hotfixes = "HotfixesTitle",
	quote = "QuoteTitle",
	cut = "CutTitle",
	blockquote = "Blockquote",
	tabs = "Tabs",
	noteTable = "Note",
	labTable = "Lab",
	tipTable = "Tip",
	infoTable = "Info",
	dangerTable = "Danger",
	hotfixesTable = "Hotfixes",
	quoteTable = "QuoteTable",
	cutTable = "Cut",
}

const noteMarginType = { top: 300, left: 567, bottom: 190 } as const;

export const wordMarginsType = {
	[WordBlockType.table]: { top: 250, bottom: 110, left: 170, right: 170 },
	[WordBlockType.fence]: { top: 300, bottom: 300, left: 397 },
	[WordBlockType.note]: noteMarginType,
	[WordBlockType.lab]: noteMarginType,
	[WordBlockType.tip]: noteMarginType,
	[WordBlockType.info]: noteMarginType,
	[WordBlockType.danger]: noteMarginType,
	[WordBlockType.hotfixes]: noteMarginType,
	[WordBlockType.quote]: noteMarginType,
	[WordBlockType.cut]: { top: 100, left: 280 },
	[WordBlockType.blockquote]: { top: 100, left: 300 },
	[WordBlockType.tabs]: { top: 250, bottom: 170, left: 170, right: 170 },
} as const;

export const wordBordersColors = {
	orange: "eb9c00",
	blue: "0096e0",
	purple: "4366ad",
	red: "d90000",
	darkGrey: "7b7b7b",
	grey: "a4a4a4",
	lightGrey: "eeeeee",
	kbd: "f8f8f8",
} as const;

const wordNoteBorderType = (color: string) => ({
	top: { style: BorderStyle.NIL },
	bottom: { style: BorderStyle.NIL },
	left: { style: BorderStyle.SINGLE, size: 20, color },
	right: { style: BorderStyle.NIL },
});

export const wordBordersType = {
	[WordBlockType.table]: {
		top: { style: BorderStyle.NIL },
		bottom: { style: BorderStyle.NIL },
		left: { style: BorderStyle.NIL },
		right: { style: BorderStyle.NIL },
		insideHorizontal: { style: BorderStyle.SINGLE, color: wordBordersColors.grey, size: 10 },
		insideVertical: { style: BorderStyle.SINGLE, color: wordBordersColors.grey, size: 10 },
	},
	[WordBlockType.fence]: {},
	[WordBlockType.note]: wordNoteBorderType(wordBordersColors.orange),
	[WordBlockType.lab]: wordNoteBorderType(wordBordersColors.blue),
	[WordBlockType.tip]: wordNoteBorderType(wordBordersColors.blue),
	[WordBlockType.info]: wordNoteBorderType(wordBordersColors.purple),
	[WordBlockType.danger]: wordNoteBorderType(wordBordersColors.red),
	[WordBlockType.hotfixes]: wordNoteBorderType(wordBordersColors.darkGrey),
	[WordBlockType.quote]: wordNoteBorderType(wordBordersColors.darkGrey),
	[WordBlockType.cut]: wordNoteBorderType(wordBordersColors.grey),
	[WordBlockType.blockquote]: {
		top: { style: BorderStyle.NIL },
		bottom: { style: BorderStyle.NIL },
		left: { style: BorderStyle.SINGLE, size: 35, color: wordBordersColors.lightGrey },
		right: { style: BorderStyle.NIL },
	},
	[WordBlockType.tabs]: {
		top: { style: BorderStyle.NIL },
		bottom: { style: BorderStyle.NIL },
		left: { style: BorderStyle.NIL },
		right: { style: BorderStyle.NIL },
		insideHorizontal: { style: BorderStyle.NIL },
		insideVertical: { style: BorderStyle.NIL },
	},
} as const;
