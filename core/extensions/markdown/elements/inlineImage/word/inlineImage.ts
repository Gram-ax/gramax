import Path from "@core/FileProvider/Path/Path";
import { imageString } from "@ext/wordExport/options/wordExportSettings";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { errorWordLayout } from "@ext/wordExport/error";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { AddOptionsWord, WordInlineChild } from "@ext/wordExport/options/WordTypes";
import { WordImageExporter } from "@ext/markdown/elements/image/word/WordImageProcessor";
import { JSONContent } from "@tiptap/core";

export const renderInlineImageWordLayout: WordInlineChild = async ({ tag, addOptions, wordRenderContext }) => {
	return imageWordLayout(tag, addOptions, wordRenderContext.parserContext);
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

const imageWordLayout = async (tag: Tag | JSONContent, addOptions: AddOptionsWord, parserContext: ParserContext) => {
	try {
		const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
		const originalWidth = parseFloat(attrs.width) || 100;
		const originalHeight = parseFloat(attrs.height) || 100;

		const { calculatedWidth, calculatedHeight } = calculateInlineImageSize(originalWidth, originalHeight);

		return [
			await WordImageExporter.getImageByPath(
				new Path(attrs.src),
				parserContext.getResourceManager(),
				calculatedWidth,
				calculatedHeight,
			),
		];
	} catch (error) {
		return errorWordLayout(imageString(parserContext.getLanguage()), parserContext.getLanguage());
	}
};
