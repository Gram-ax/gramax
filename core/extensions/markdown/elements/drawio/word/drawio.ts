import { errorWordLayout } from "@ext/wordExport/error";
import { WordFontStyles, diagramString } from "@ext/wordExport/options/wordExportSettings";
import { Paragraph, TextRun } from "docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { WordImageProcessor } from "../../image/word/WordImageProcessor";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";

export const drawioWordLayout: WordBlockChild = async ({ tag, addOptions, wordRenderContext }) => {
	try {
		const image = await WordImageProcessor.getImageFromSvgPath(
			new Path(tag.attributes.src),
			wordRenderContext.parserContext.getResourceManager(),
			addOptions?.maxPictureWidth,
		);
		const paragraphs = [new Paragraph({ children: [image], style: WordFontStyles.picture })];

		if (tag.attributes.title) {
			paragraphs.push(
				new Paragraph({
					children: [new TextRun({ text: tag.attributes.title })],
					style: WordFontStyles.pictureTitle,
				}),
			);
		}

		return paragraphs;
	} catch (error) {
		return errorWordLayout(diagramString(wordRenderContext.parserContext.getLanguage()), wordRenderContext.parserContext.getLanguage());
	}
};
