import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { wordListInstancesCounter } from "../../table/word/transformer/WordListInstancesCounter";
import { wordNestedListMaxLevel } from "./WordListLevel";
import { WordListRenderer } from "./WordListRenderer";

export const orderListWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	const reference = "orderedList";

	const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
	const level = Math.min(attrs.depth ?? 0, wordNestedListMaxLevel);
	const instance = wordListInstancesCounter.generateInstanceNumberForList();
	const numbering = { reference, level, instance };

	return await WordListRenderer.renderList(state, tag, { ...addOptions, numbering });
};
