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

export const imageWordLayout = async (
	tag: Tag | JSONContent,
	addOptions: AddOptionsWord,
	parserContext: ParserContext,
) => {
	try {
		const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
		return [
			await WordImageExporter.getImageByPath(
				new Path(attrs.src),
				parserContext.getResourceManager(),
				addOptions?.maxPictureWidth,
			),
		];
	} catch (error) {
		return errorWordLayout(imageString(parserContext.getLanguage()), parserContext.getLanguage());
	}
};
