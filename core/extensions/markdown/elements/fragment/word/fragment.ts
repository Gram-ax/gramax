import type { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { errorWordLayout } from "@ext/wordExport/error";
import type { WordBlockChild } from "@ext/wordExport/options/WordTypes";
import { fragmentString } from "@ext/wordExport/options/wordExportSettings";
import type { JSONContent } from "@tiptap/core";

export const fragmentWordLayout: WordBlockChild<JSONContent> = async (props) => {
	const { state, tag, addOptions, wordRenderContext } = props;
	const attrs = tag.attrs;

	if (attrs.content) {
		const children = attrs.content;
		const fragmentAddOptions = {
			...addOptions,
			fragmentId: attrs.id,
		};
		return (await Promise.all(children.map((child) => state.renderBlock(child as Tag, fragmentAddOptions)))).flat();
	}
	return errorWordLayout(
		fragmentString(wordRenderContext.parserContext.getLanguage()),
		wordRenderContext.parserContext.getLanguage(),
	);
};
