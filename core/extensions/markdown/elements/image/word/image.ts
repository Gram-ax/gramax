import { Paragraph, TextRun } from "docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { WordExportHelper } from "../../../../wordExport/WordExportHelpers";
import { WordFontStyles, imageString } from "@ext/wordExport/options/wordExportSettings";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import ResourceManager from "@core/Resource/ResourceManager";
import { errorWordLayout } from "@ext/wordExport/error";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { AddOptionsWord } from "@ext/wordExport/options/WordTypes";

export const imageWordLayout = async (
	tag: Tag,
	addOptions: AddOptionsWord,
	resourceManager: ResourceManager,
	parserContext: ParserContext,
) => {
	try {
		const image = await WordExportHelper.getImageByPath(
			new Path(tag.attributes.src),
			resourceManager,
			addOptions?.maxPictureWidth,
		);

		const paragraphs = [
			new Paragraph({ children: [image], style: WordFontStyles.picture }),
			...(tag.attributes.title
				? [
						new Paragraph({
							children: [new TextRun({ text: tag.attributes.title })],
							style: WordFontStyles.pictureTitle,
						}),
				  ]
				: []),
		];

		return paragraphs;
	} catch (error) {
		return errorWordLayout(imageString(parserContext.getLanguage()), parserContext.getLanguage());
	}
};
