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
	return imageWordLayout(tag, addOptions, wordRenderContext.parserContext);
};

export const imageWordLayout = async (
	tag: Tag | JSONContent,
	addOptions: AddOptionsWord,
	parserContext: ParserContext,
) => {
	try {
		const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
		return [
			new Paragraph({
				children: [
					await WordImageExporter.getImageByPath(
						new Path(attrs.src),
						parserContext.getResourceManager(),
						addOptions?.maxPictureWidth,
						undefined,
						attrs.crop,
						attrs.objects,
						attrs.scale,
					),
				],
				style: WordFontStyles.picture,
				keepNext: true,
			}),
			...AnnotationText.getText(attrs.title, attrs.objects),
		];
	} catch (error) {
		return errorWordLayout(imageString(parserContext.getLanguage()), parserContext.getLanguage());
	}
};
