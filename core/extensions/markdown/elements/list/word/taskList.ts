import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { wordNestedListMaxLevel } from "./WordListLevel";
import { WordListRenderer } from "./WordListRenderer";

export const taskListWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	const reference = "taskList";

	const attrs = "attributes" in tag ? tag.attributes : (tag as any).attrs;
	const level = Math.min(attrs.depth ?? 0, wordNestedListMaxLevel);
	const numbering = { reference, level };

	return await WordListRenderer.renderList(state, tag, { numbering, ...addOptions });
};
