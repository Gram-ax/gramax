import { TextSelection } from "prosemirror-state";

const replaceList = (pos, node, tr, schema) => {
	const ListPos = pos;
	const ListAttrs = node.attrs;
	const ListSize = node.nodeSize;
	const replacementNode = schema.create(ListAttrs, node.content);

	tr.replaceRangeWith(ListPos, ListPos + ListSize, replacementNode);
};

function toggleList({ state, dispatch, listName }) {
	const { schema } = state;
	const { ordered_list, bullet_list } = schema.nodes;
	const { tr, selection } = state;
	const list_schema = listName === "ordered_list" ? ordered_list : bullet_list;
	const revert_list_schema = listName !== "ordered_list" ? ordered_list : bullet_list;
	let actionTaken = false;

	const originalSelection = { from: selection.from, to: selection.to };

	state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
		if (node.type !== revert_list_schema) return;

		if (state.selection.from <= pos && state.selection.to >= pos + node.nodeSize) {
			replaceList(pos, node, tr, list_schema);
			actionTaken = true;
		} else {
			const posFirstChild = pos + 1;

			if (posFirstChild >= state.selection.from) {
				replaceList(pos, node, tr, list_schema);
				actionTaken = true;
			}
		}
	});

	if (!actionTaken) return false;

	const newSelection = TextSelection.between(
		tr.doc.resolve(originalSelection.from),
		tr.doc.resolve(originalSelection.to),
	);
	tr.setSelection(newSelection);

	dispatch(tr);
	return true;
}

export { toggleList };
