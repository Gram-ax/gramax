import { HeadingStyles as styleConfig } from "@ext/wordExport/wordDocumentStyles";
import { createParagraph } from "./createParagraph";
import { ParagraphType, levelSpacingConfig, wordFontSizes, wordFontTypes } from "./wordExportSettings";
import { IRunOptions, Paragraph, ParagraphChild, TextRun } from "docx";

interface SpacingConfig {
	line: number;
	before: number;
	after: number;
}

export function createTitleParagraph(text: string, level: number) {
	if (level > 4 && level < 1) level = 1;

	const style = styleConfig[level];
	const textRun = new TextRun({ text });

	return createParagraph([textRun], style);
}

export function createParagraphBeforeTable() {
	return new Paragraph({
		children: [createEmptyTextRun({ size: 8 })],
	});
}

export function createParagraphAfterTable() {
	return new Paragraph({
		children: [createEmptyTextRun()],
	});
}

export function createContent(text: string, addOptions?: IRunOptions) {
	const font = addOptions?.bold ? wordFontTypes.bold : wordFontTypes.normal;

	return new TextRun({
		text,
		font,
		...addOptions,
		size: addOptions?.size ?? wordFontSizes.normal,
	});
}

export function createContentsParagraph(children: ParagraphChild[]) {
	const spacingConfig = createSpacingConfig(ParagraphType.normal);
	return createParagraph(children, spacingConfig);
}

export function createSpacingConfig(paragraphType: ParagraphType): SpacingConfig {
	if (levelSpacingConfig[paragraphType]) return levelSpacingConfig[paragraphType];
	return levelSpacingConfig[ParagraphType.normal];
}

export const createEmptyTextRun = (addOptions?: IRunOptions) => createContent("\u00A0", addOptions);
