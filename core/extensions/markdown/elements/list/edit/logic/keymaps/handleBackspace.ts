import { findListItemPos } from "@ext/markdown/elements/list/edit/logic/keymaps/findListItemPos";
import { hasListBefore } from "@ext/markdown/elements/list/edit/logic/keymaps/hasListBefore";
import { hasListItemBefore } from "@ext/markdown/elements/list/edit/logic/keymaps/hasListItemBefore";
import { listItemHasSubList } from "@ext/markdown/elements/list/edit/logic/keymaps/listItemHasSubList";
import type { Editor } from "@tiptap/core";
import { isAtStartOfNode, isNodeActive, isNodeSelection } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";

export const handleBackspace = (editor: Editor, name: string, parentListTypes: string[]) => {
	// this is required to still handle the undo handling
	if (editor.commands.undoInputRule()) {
		return true;
	}

	const isFocusedAtBlock = isNodeSelection(editor.state.selection);

	// if the selection is not collapsed
	// we can rely on the default backspace behavior
	if (editor.state.selection.from !== editor.state.selection.to && !isFocusedAtBlock) {
		return false;
	}

	// if the current item is NOT inside a list item &
	// the previous item is a list (orderedList or bulletList)
	// move the cursor into the list and delete the current item
	if (!isNodeActive(editor.state, name) && hasListBefore(editor.state, name, parentListTypes)) {
		const { $anchor } = editor.state.selection;

		const $listPos = editor.state.doc.resolve($anchor.before() - 1);

		const listDescendants: Array<{ node: Node; pos: number }> = [];

		$listPos.node().descendants((node, pos) => {
			if (node.type.name === name) {
				listDescendants.push({ node, pos });
			}
		});

		const lastItem = listDescendants.at(-1);

		if (!lastItem) {
			return false;
		}

		const $lastItemPos = editor.state.doc.resolve($listPos.start() + lastItem.pos + 1);
		const lastChild = lastItem.node.lastChild;
		const isBlockWithoutContent = lastChild?.isBlock && !lastChild?.type.spec.content;
		const insertPos = isBlockWithoutContent ? $lastItemPos.end() - 1 : $lastItemPos.end();

		return editor
			.chain()
			.cut({ from: $anchor.start() - 1, to: $anchor.end() + 1 }, insertPos)
			.joinForward()
			.run();
	}

	// if the cursor is not inside the current node type
	// do nothing and proceed
	if (!isNodeActive(editor.state, name)) {
		return false;
	}

	// if the cursor at first block node
	// delete this block node
	const { $from, to } = editor.state.selection;
	const isBlockNodeAtStartOfNode = isFocusedAtBlock && $from.pos + 1 === to && $from.parentOffset === 0;
	if (isBlockNodeAtStartOfNode) {
		return editor.chain().deleteRange({ from: $from.pos, to }).run();
	}

	const listItemPos = findListItemPos(name, editor.state);

	if (!listItemPos) {
		return false;
	}

	// if the cursor is not at the start of a node and not start of the list item
	// do nothing and proceed
	if (!isAtStartOfNode(editor.state) || listItemPos.$pos.parentOffset > 0) {
		return false;
	}

	const $prev = editor.state.doc.resolve(listItemPos.$pos.pos - 2);
	const prevNode = $prev.node(listItemPos.depth);

	const previousListItemHasSubList = listItemHasSubList(name, editor.state, prevNode);

	// if the previous item is a list item and doesn't have a sublist, join the list items
	if (hasListItemBefore(name, editor.state) && !previousListItemHasSubList) {
		return editor.commands.joinItemBackward();
	}

	// otherwise in the end, a backspace should
	// always just lift the list item if
	// joining / merging is not possible
	return editor.chain().liftListItem(name).run();
};
