import type { Selection } from "@tiptap/pm/state";

export const hasActiveSort = (selection: Selection): boolean => {
	let sorted = false;
	for (let i = selection.$from.depth; i > 0; i--) {
		const node = selection.$from.node(i);
		if (node.type.name === "table") {
			node.child(0).forEach((cellNode) => {
				if (sorted) return;
				if (cellNode.attrs.sort) sorted = true;
			});
			break;
		}
	}
	return sorted;
};
