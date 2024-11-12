import { Paragraph } from "docx";
import Path from "@core/FileProvider/Path/Path";
import { WordImageProcessor } from "./WordImageProcessor";
import { WordFontStyles, imageString } from "@ext/wordExport/options/wordExportSettings";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { errorWordLayout } from "@ext/wordExport/error";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { AddOptionsWord, WordBlockChild } from "@ext/wordExport/options/WordTypes";
import AnnotationText from "@ext/markdown/elements/image/word/imageEditor/AnnotationText";

export const renderImageWordLayout: WordBlockChild = async ({ tag, addOptions, wordRenderContext }) => {
	return imageWordLayout(tag, addOptions, wordRenderContext.parserContext);
};

export const imageWordLayout = async (tag: Tag, addOptions: AddOptionsWord, parserContext: ParserContext) => {
	try {
		return [
			new Paragraph({
				children: [
					await WordImageProcessor.getImageByPath(
						new Path(tag.attributes.src),
						parserContext.getResourceManager(),
						addOptions?.maxPictureWidth,
						undefined,
						tag.attributes.crop,
						tag.attributes.objects,
						tag.attributes.scale,
					),
				],
				style: WordFontStyles.picture,
				keepNext: true,
			}),
			...AnnotationText.getText(tag.attributes.title, tag.attributes.objects),
		];
	} catch (error) {
		return errorWordLayout(imageString(parserContext.getLanguage()), parserContext.getLanguage());
	}
};
