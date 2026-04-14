import type { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import type { Tag } from "../../../core/render/logic/Markdoc";

export const includeWordLayout: WordBlockChild = async ({ state, tag }) => {
	return (await Promise.all(tag.children.map((child) => state.renderBlock(child as Tag)))).flat();
};
