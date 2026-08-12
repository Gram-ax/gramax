import type { NodeRange } from "@tiptap/core";
import type { EditorState } from "@tiptap/pm/state";

export const getActiveNodesFromSelection = (state: EditorState): NodeRange[] => {
	const { from, to } = state.selection;
	const nodeRanges: NodeRange[] = [];
	state.doc.nodesBetween(from, to, (node, pos) => {
		if (node.isText) {
			return;
		}

		const relativeFrom = Math.max(from, pos);
		const relativeTo = Math.min(to, pos + node.nodeSize);

		nodeRanges.push({
			node,
			from: relativeFrom,
			to: relativeTo,
		});
	});

	return nodeRanges;
};
