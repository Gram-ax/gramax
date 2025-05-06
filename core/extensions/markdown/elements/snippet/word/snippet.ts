import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { errorWordLayout } from "@ext/wordExport/error";
import { WordBlockChild } from "@ext/wordExport/options/WordTypes";
import { snippetString } from "@ext/wordExport/options/wordExportSettings";

export const snippetWordLayout: WordBlockChild = async ({ state, tag, addOptions, wordRenderContext }) => {
	const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
	if (attrs.content) {
		const children = "children" in tag ? tag.children : tag.content;
		return (await Promise.all(children.map((child) => state.renderBlock(child as Tag, addOptions)))).flat();
	} else {
		return errorWordLayout(
			snippetString(wordRenderContext.parserContext.getLanguage()),
			wordRenderContext.parserContext.getLanguage(),
		);
	}
};
