import { Paragraph, TextRun } from "docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { WordExportHelper } from "../../../../wordExport/WordExportHelpers";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { WordFontStyles, diagramString } from "@ext/wordExport/options/wordExportSettings";
import { errorWordLayout } from "@ext/wordExport/error";

export const drawioWordLayout: WordBlockChild = async ({ tag, addOptions, resourceManager, parserContext }) => {
	try {
		const image = await WordExportHelper.getImageFromSvgPath(
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
		return errorWordLayout(diagramString(parserContext.getLanguage()), parserContext.getLanguage());
	}
};
