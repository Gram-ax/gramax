import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { wordListInstancesCounter } from "../../table/word/transformer/WordListInstancesCounter";
import { wordNestedListMaxLevel } from "./WordListLevel";
import { WordListRenderer } from "./WordListRenderer";

export const orderListWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	const reference = "orderedList";
	const level = Math.min(tag.attributes.depth ?? 0, wordNestedListMaxLevel);
	const instance = wordListInstancesCounter.generateInstanceNumberForList();
	const numbering = { reference, level, instance };

	return await WordListRenderer.renderList(state, tag, { numbering, ...addOptions });
};
