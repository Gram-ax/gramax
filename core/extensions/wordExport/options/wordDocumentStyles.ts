import { wordFontSizes, wordFontTypes } from "@ext/wordExport/options/wordExportSettings";
import { AlignmentType, LevelFormat, convertMillimetersToTwip } from "docx";
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
	text: `%${level + 1}.`,
});

const getBulletSymbol = (level: number) => ({
	text: levelText[level % 3],
	font: levelFont[level % 3],
});

export const leftIndentMillimeters = 7;

export const wordDocumentStyles: Omit<IPropertiesOptions, "sections"> = {
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
							font: wordFontTypes.numbering,
							size: wordFontSizes.list,
						},
						paragraph: {
							indent: {
								left: convertMillimetersToTwip(5 + 5 * level),
								hanging: convertMillimetersToTwip(5),
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
								size: wordFontSizes.list,
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
