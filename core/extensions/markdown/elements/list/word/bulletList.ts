import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { wordNestedListMaxLevel } from "./WordListLevel";
import { WordListRenderer } from "./WordListRenderer";

export const ulListWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	const reference = "bulletList";

	const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
	const level = Math.min(attrs.depth ?? 0, wordNestedListMaxLevel);
	const numbering = { reference, level };

	return await WordListRenderer.renderList(state, tag, { ...addOptions, numbering });
};
