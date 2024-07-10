import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { errorWordLayout } from "@ext/wordExport/error";
import { paragraphWordLayout } from "@ext/markdown/elements/paragraph/word/paragraph";
import { WordBlockChild } from "@ext/wordExport/options/WordTypes";
import { snippetString } from "@ext/wordExport/options/wordExportSettings";

export const snippetWordLayout: WordBlockChild = async ({ state, tag, addOptions, parserContext }) => {
	if (tag.attributes.content) {
		return (
			await Promise.all(
				tag.children.map((child) => paragraphWordLayout({ state, tag: child as Tag, addOptions })),
			)
		).flat();
	} else {
		return errorWordLayout(snippetString(parserContext.getLanguage()), parserContext.getLanguage());
	}
};
