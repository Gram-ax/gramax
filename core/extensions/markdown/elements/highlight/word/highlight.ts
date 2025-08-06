import { HIGHLIGHT_DOCX_NAMES } from "@ext/markdown/elements/highlight/edit/model/consts";
import { WordInlineChild } from "../../../../wordExport/options/WordTypes";

export const highlightWordLayout: WordInlineChild = async ({ state, tag, addOptions }) => {
	const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
	const highlight = attrs.color;
	return state.renderInline(tag, { ...addOptions, highlight: HIGHLIGHT_DOCX_NAMES[highlight] });
};
