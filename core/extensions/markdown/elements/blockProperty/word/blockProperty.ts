import { WordBlockChild } from "../../../../wordExport/options/WordTypes";

export const blockPropertyWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	const children = "children" in tag ? tag.children : tag.content;
	const results = await Promise.all(
		children.map((child) =>
			state.renderBlock(child, {
				...addOptions,
			}),
		),
	);

	return results.flat();
};
