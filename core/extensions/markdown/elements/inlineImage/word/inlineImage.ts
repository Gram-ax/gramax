import Path from "@core/FileProvider/Path/Path";
import ResourceManager from "@core/Resource/ResourceManager";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { WordImageExporter } from "@ext/markdown/elements/image/word/WordImageProcessor";
import { errorWordLayout } from "@ext/wordExport/error";
import { AddOptionsWord, WordInlineChild } from "@ext/wordExport/options/WordTypes";
import { imageString } from "@ext/wordExport/options/wordExportSettings";
import { JSONContent } from "@tiptap/core";

export const renderInlineImageWordLayout: WordInlineChild = async ({ tag, addOptions, wordRenderContext }) => {
	return imageWordLayout(tag, addOptions, wordRenderContext.parserContext, wordRenderContext.resourceManager);
};

const MAX_HEIGHT = 28; // inline-image-height(1.7em) in px

const calculateInlineImageSize = (originalWidth: number, originalHeight: number, maxHeight: number = MAX_HEIGHT) => {
	if (originalHeight <= maxHeight) {
		return {
			width: originalWidth,
			height: originalHeight,
		};
	}

	const scale = maxHeight / originalHeight;
	const scaledWidth = Math.round(originalWidth * scale);

	return {
		calculatedWidth: scaledWidth,
		calculatedHeight: maxHeight,
	};
};

const imageWordLayout = async (
	tag: Tag | JSONContent,
	addOptions: AddOptionsWord,
	parserContext: ParserContext,
	resourceManager: ResourceManager,
) => {
	try {
		const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
		const originalWidth = parseFloat(attrs.width) || 100;
		const originalHeight = parseFloat(attrs.height) || 100;

		const { calculatedWidth, calculatedHeight } = calculateInlineImageSize(originalWidth, originalHeight);

		return [
			await WordImageExporter.getImageByPath(
				new Path(attrs.src),
				resourceManager,
				calculatedWidth,
				calculatedHeight,
			),
		];
	} catch (error) {
		return errorWordLayout(imageString(parserContext.getLanguage()), parserContext.getLanguage());
	}
};
