import { getListItemAfter } from "@ext/markdown/elements/list/edit/logic/keymaps/getListItemAfter";
import { nextListIsDeeper } from "@ext/markdown/elements/list/edit/logic/keymaps/nextListIsDeeper";
import { nextListIsHigher } from "@ext/markdown/elements/list/edit/logic/keymaps/nextListIsHigher";
import type { Editor } from "@tiptap/core";
import { isAtEndOfNode, isNodeActive } from "@tiptap/core";

export const handleDelete = (editor: Editor, name: string) => {
	// if the cursor is not inside the current node type
	// do nothing and proceed
	if (!isNodeActive(editor.state, name)) {
		return false;
	}

	// if the cursor is not at the end of a node
	// do nothing and proceed
	if (!isAtEndOfNode(editor.state, name)) {
		return false;
	}

	// if the selection is not collapsed, or not within a single node
	// do nothing and proceed
	const { selection } = editor.state;
	const { $from, $to } = selection;

	if (!selection.empty && $from.sameParent($to)) {
		return false;
	}

	// check if the next node is a list with a deeper depth
	if (nextListIsDeeper(name, editor.state)) {
		return editor
			.chain()
			.focus(editor.state.selection.from + 4)
			.lift(name)
			.joinBackward()
			.run();
	}

	if (nextListIsHigher(name, editor.state)) {
		return editor.chain().joinForward().joinBackward().run();
	}

	// if the next node is not a list, join to the current list item
	if (isAtEndOfNode(editor.state, name) && !getListItemAfter(name, editor.state)) {
		const isNotEndOfDoc = editor.state.selection.from + 3 < editor.state.doc.content.size;
		if (!isNotEndOfDoc) return editor.commands.joinItemForward();

		const nextNode = editor.state.doc.nodeAt(editor.state.selection.from + 3);
		if (!nextNode) return editor.commands.joinItemForward();

		const deleteFrom = editor.state.selection.from + 3;
		const deleteTo = deleteFrom + nextNode.nodeSize;

		return editor
			.chain()
			.deleteRange({ from: deleteFrom, to: deleteTo })
			.insertContentAt(editor.state.selection.from, nextNode, { updateSelection: false })
			.run();
	}

	const nextListItemPos = editor.state.selection.from + 2;
	const nextListItem = getListItemAfter(name, editor.state);

	if (!nextListItem) {
		return editor.commands.joinItemForward();
	}

	const nextListItemContent = nextListItem.content.content.map((child) => child.toJSON());

	const deleteFrom = nextListItemPos;
	const deleteTo = deleteFrom + nextListItem.nodeSize;

	return editor
		.chain()
		.deleteRange({ from: deleteFrom, to: deleteTo })
		.insertContentAt(editor.state.selection.from, nextListItemContent, { updateSelection: false })
		.run();
};
