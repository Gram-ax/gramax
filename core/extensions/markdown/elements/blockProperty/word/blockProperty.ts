import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";

export const blockPropertyWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	const results = await Promise.all(
		tag.children
			.filter((child) => child instanceof Tag)
			.map((child) =>
				state.renderBlock(child, {
					...addOptions,
				}),
			),
	);

	return results.flat();
};
