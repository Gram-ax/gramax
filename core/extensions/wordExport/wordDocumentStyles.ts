import {
	ParagraphType,
	WordFontColors,
	levelSpacingConfig,
	wordFontSizes,
	wordFontTypes,
} from "@ext/wordExport/wordExportSettings";
import { AlignmentType, HeadingLevel, LevelFormat, convertMillimetersToTwip } from "docx";
import { IPropertiesOptions } from "docx/build/file/core-properties";

const levelFormat = {
	0: LevelFormat.DECIMAL,
	1: LevelFormat.LOWER_LETTER,
	2: LevelFormat.LOWER_ROMAN,
};

const levelText = {
	0: "\u00B7",
	1: "\u25CB",
	2: "\u00A7",
};

const levelFont = {
	0: "Symbol",
	1: "Times New Roman",
	2: "Wingdings",
};

const getNumberFormat = (level: number) => ({
	format: levelFormat[level % 3],
	text: `%${level + 1}`,
});

const getBulletSymbol = (level: number) => ({
	text: levelText[level % 3],
	font: levelFont[level % 3],
});

export const HeadingStyles = {
	1: HeadingLevel.HEADING_1,
	2: HeadingLevel.HEADING_2,
	3: HeadingLevel.HEADING_3,
	4: HeadingLevel.HEADING_4,
};

export const leftIndentMillimeters = 7;

export const wordDocumentStyles: Omit<IPropertiesOptions, "sections"> = {
	styles: {
		default: {
			heading1: {
				run: {
					font: wordFontTypes.heading,
					size: wordFontSizes.heading[1],
					bold: true,
				},
				paragraph: {
					spacing: levelSpacingConfig[ParagraphType.headingOne],
				},
			},
			heading2: {
				run: {
					font: wordFontTypes.heading,
					size: wordFontSizes.heading[2],
				},
				paragraph: {
					spacing: levelSpacingConfig[ParagraphType.headingTwo],
				},
			},
			heading3: {
				run: {
					font: wordFontTypes.heading,
					size: wordFontSizes.heading[3],
				},
				paragraph: {
					spacing: levelSpacingConfig[ParagraphType.headingThree],
				},
			},
			heading4: {
				run: {
					font: wordFontTypes.heading,
					size: wordFontSizes.heading[4],
				},
				paragraph: {
					spacing: levelSpacingConfig[ParagraphType.headingFour],
				},
			},
		},
		paragraphStyles: [
			{
				id: "fence",
				name: "Fence",
				basedOn: "Fence",
				next: "normal",
				run: {
					font: wordFontTypes.code,
					size: wordFontSizes.code,
					color: WordFontColors.fence,
				},
				paragraph: {
					spacing: levelSpacingConfig[ParagraphType.fence],
					indent: { left: convertMillimetersToTwip(leftIndentMillimeters) },
				},
			},
		],
	},
	numbering: {
		config: [
			{
				reference: "orderedList",
				levels: Array.from({ length: 9 }).map((_, level) => ({
					level,
					...getNumberFormat(level),
					alignment: AlignmentType.START,
					style: {
						run: {
							font: wordFontTypes.heading,
							size: wordFontSizes.normal,
						},
						paragraph: {
							indent: {
								left: convertMillimetersToTwip(7.5 + 10 * level),
								hanging: convertMillimetersToTwip(6.3),
							},
						},
					},
				})),
			},
			{
				reference: "bulletList",
				levels: Array.from({ length: 9 }).map((_, level) => {
					const { text, font } = getBulletSymbol(level);
					return {
						level,
						format: LevelFormat.BULLET,
						text,
						alignment: AlignmentType.START,
						style: {
							run: {
								font,
								size: wordFontSizes.normal,
							},
							paragraph: {
								indent: {
									left: convertMillimetersToTwip(5 + 5 * level),
									hanging: convertMillimetersToTwip(5),
								},
							},
						},
					};
				}),
			},
		],
	},
};
