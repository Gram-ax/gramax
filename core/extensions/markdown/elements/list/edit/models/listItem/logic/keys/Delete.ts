import { listTypes } from "@ext/markdown/elements/list/edit/logic/toggleList";
import { Editor } from "@tiptap/core";
import isTypeOf from "../../../../../../../elementsUtils/isTypeOf";
import KeyboardRule from "../../../../../../../elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "../../../../../../../elementsUtils/keyboardShortcuts/model/KeyboardShortcut";
import { isFocusBeforeList } from "./utils";

const getDeleteShortcuts = (): KeyboardShortcut => {
	return { key: "Delete", rules: [deleteNestedListItem, defaultDelete] };
};

const deleteNestedListItem: KeyboardRule = ({ editor, typeName, node, nodePosition }) => {
	if (
		isFocusBeforeList(editor.state, node, nodePosition) &&
		node.childCount > 1 &&
		isTypeOf(node.child(1), listTypes) &&
		node.lastChild.childCount == 1
	) {
		return deleteAction(editor, typeName);
	} else return false;
};

const defaultDelete: KeyboardRule = ({ editor }) => editor.chain().joinForward().run();

const deleteAction = (editor: Editor, liftItemName: string): boolean => {
	const firstFocusAnchor = editor.state.selection.anchor;
	const dlt = editor
		.chain()
		.focus(editor.state.selection.anchor + 4)
		.liftListItem(liftItemName)
		.joinBackward()
		.run();
	const focusBack = editor.commands.focus(firstFocusAnchor);

	return dlt && focusBack;
};

export default getDeleteShortcuts;
