import { WordBlockChild } from "../../../../wordExport/WordTypes";
import { Tag } from "../../../core/render/logic/Markdoc";

export const includeWordLayout: WordBlockChild = async ({ state, tag }) => {
	return (await Promise.all(tag.children.map(async (child) => await state.renderBlock(child as Tag)))).flat();
};
