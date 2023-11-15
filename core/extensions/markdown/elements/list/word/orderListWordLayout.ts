import { WordBlockChild } from "../../../../wordExport/WordTypes";
import { wordListInstancesCounter } from "../../table/word/transformer/WordListInstancesCounter";
import { wordNestedListMaxLevel } from "./WordListLevel";
import { WordListRenderer } from "./WordListRenderer";

export const orderListWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	return await WordListRenderer.renderList(state, tag, {
		numbering: {
			reference: "orderedList",
			level: Math.min(tag.attributes.depth ?? 0, wordNestedListMaxLevel),
			instance: wordListInstancesCounter.generateInstanceNumberForList(),
		},
		...addOptions,
	});
};
