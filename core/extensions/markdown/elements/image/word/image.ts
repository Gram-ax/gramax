import Path from "@core/FileProvider/Path/Path";
import type ResourceManager from "@core/Resource/ResourceManager";
import docx from "@dynamicImports/docx";
import type ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import type { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import AnnotationText from "@ext/markdown/elements/image/word/imageEditor/AnnotationText";
import { WordImageExporter } from "@ext/markdown/elements/image/word/WordImageProcessor";
import { errorWordLayout } from "@ext/wordExport/error";
import getWordResourceManager from "@ext/wordExport/getWordResourceManager";
import type { AddOptionsWord, WordBlockChild } from "@ext/wordExport/options/WordTypes";
import { imageString, WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { wrapWithListContinuationBookmark } from "@ext/wordExport/utils/listContinuation";
import type { JSONContent } from "@tiptap/core";

export const renderImageWordLayout: WordBlockChild = async ({ tag, addOptions, wordRenderContext }) => {
	const result = await imageWordLayout(
		tag,
		addOptions,
		wordRenderContext.parserContext,
		wordRenderContext.resourceManager,
	);
	return Array.isArray(result) ? result : [result];
};

export const imageWordLayout = async (
	tag: Tag | JSONContent,
	addOptions: AddOptionsWord,
	parserContext: ParserContext,
	resourceManager: ResourceManager,
) => {
	try {
		const { Paragraph, AlignmentType } = await docx();
		const attrs = "attributes" in tag ? tag.attributes : tag.attrs;

		const wordResourceManager = await getWordResourceManager(addOptions, parserContext, resourceManager);

		const imageRun = await WordImageExporter.getImageByPath(
			new Path(attrs.src),
			wordResourceManager,
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
			alignment: AlignmentType.CENTER,
		});

		const annotations = await AnnotationText.getText(attrs.title, attrs.objects, addOptions);
		let result = [imageParagraph, ...annotations];
		if (addOptions?.listContinuation) {
			result = await wrapWithListContinuationBookmark(result, addOptions.listContinuationLevel);
		}
		return result;
	} catch (error) {
		console.error(error);
		return errorWordLayout(imageString(parserContext.getLanguage()), parserContext.getLanguage());
	}
};
