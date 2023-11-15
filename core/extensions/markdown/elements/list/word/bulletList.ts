import { WordBlockChild } from "../../../../wordExport/WordTypes";
import { wordNestedListMaxLevel } from "./WordListLevel";
import { WordListRenderer } from "./WordListRenderer";

export const ulListWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	return await WordListRenderer.renderList(state, tag, {
		bullet: { level: Math.min(tag.attributes.depth ?? 0, wordNestedListMaxLevel) },
		...addOptions,
	});
};
