import { Paragraph } from "docx";
import Path from "@core/FileProvider/Path/Path";
import { WordFontStyles, imageString } from "@ext/wordExport/options/wordExportSettings";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { errorWordLayout } from "@ext/wordExport/error";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { AddOptionsWord, WordBlockChild } from "@ext/wordExport/options/WordTypes";
import AnnotationText from "@ext/markdown/elements/image/word/imageEditor/AnnotationText";
import { WordImageExporter } from "@ext/markdown/elements/image/word/WordImageProcessor";
import { JSONContent } from "@tiptap/core";

export const renderImageWordLayout: WordBlockChild = async ({ tag, addOptions, wordRenderContext }) => {
	const result = await imageWordLayout(tag, addOptions, wordRenderContext.parserContext);
	return Array.isArray(result) ? result : [result];
};

export const imageWordLayout = async (
	tag: Tag | JSONContent,
	addOptions: AddOptionsWord,
	parserContext: ParserContext,
) => {
	try {
		const attrs = "attributes" in tag ? tag.attributes : tag.attrs;

		const imageRun = await WordImageExporter.getImageByPath(
			new Path(attrs.src),
			parserContext.getResourceManager(),
			addOptions?.maxPictureWidth,
			undefined,
			attrs.crop,
			attrs.objects,
			attrs.scale,
		);

		const indent = typeof addOptions?.indent === "number" ? { left: addOptions.indent } : undefined;

		const imageParagraph = new Paragraph({
			children: [imageRun],
			style: WordFontStyles.picture,
			keepNext: true,
			indent,
		});

		const annotations = AnnotationText.getText(attrs.title, attrs.objects, addOptions);
		return [imageParagraph, ...annotations];
	} catch (error) {
		return errorWordLayout(imageString(parserContext.getLanguage()), parserContext.getLanguage());
	}
};
