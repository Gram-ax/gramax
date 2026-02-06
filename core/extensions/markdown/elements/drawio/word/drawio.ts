import docx from "@dynamicImports/docx";
import { WordImageExporter } from "@ext/markdown/elements/image/word/WordImageProcessor";
import { errorWordLayout } from "@ext/wordExport/error";
import getWordResourceManager from "@ext/wordExport/getWordResourceManager";
import { diagramString, WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import Path from "../../../../../logic/FileProvider/Path/Path";
import type { WordBlockChild } from "../../../../wordExport/options/WordTypes";

export const drawioWordLayout: WordBlockChild = async ({ tag, addOptions, wordRenderContext }) => {
	try {
		const { Paragraph, TextRun } = await docx();
		const resourceManager = await getWordResourceManager(
			addOptions,
			wordRenderContext.parserContext,
			wordRenderContext.resourceManager,
		);

		const image = await WordImageExporter.getImageFromSvgPath(
			new Path(tag.attributes.src),
			resourceManager,
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
		return errorWordLayout(
			diagramString(wordRenderContext.parserContext.getLanguage()),
			wordRenderContext.parserContext.getLanguage(),
		);
	}
};
