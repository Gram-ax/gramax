import { getNodeNameFromCursor } from "@core-ui/ContextServices/ButtonStateService/hooks/useType";
import { TextSelection } from "prosemirror-state";
import { Editor, Dispatch } from "@tiptap/core";

const replaceList = (pos, node, tr, list_schema) => {
	const ListPos = pos;
	const ListAttrs = node.attrs;
	const ListSize = node.nodeSize;
	const replacementNode = list_schema.create(ListAttrs, node.content);

	tr.replaceRangeWith(ListPos, ListPos + ListSize, replacementNode);
};

interface ToggleListProps {
	editor: Editor;
	dispatch: Dispatch;
	listName: string;
}

export const listTypes = ["ordered_list", "bullet_list", "task_list"];

function toggleList({ editor, dispatch, listName }: ToggleListProps) {
	const { state } = editor.view;
	const { schema } = state;
	const { tr, selection } = state;

	const { actions } = getNodeNameFromCursor(editor);
	const currAction = actions.pop();

	const cur_schema = schema.nodes[listName];
	const change_to_name = listTypes.includes(currAction) ? currAction : listName;
	const change_to_schema = schema.nodes[change_to_name];

	if (!cur_schema || cur_schema === change_to_schema) return false;

	let actionTaken = false;

	const originalSelection = { from: selection.from, to: selection.to };

	state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
		if (node.type !== change_to_schema) return;

		if (state.selection.from <= pos && state.selection.to >= pos + node.nodeSize) {
			replaceList(pos, node, tr, cur_schema);
			actionTaken = true;
		} else {
			const posFirstChild = pos + 1;

			if (posFirstChild >= state.selection.from) {
				replaceList(pos, node, tr, cur_schema);
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
