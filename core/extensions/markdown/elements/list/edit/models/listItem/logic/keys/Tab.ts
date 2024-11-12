import { listTypes } from "@ext/markdown/elements/list/edit/logic/toggleList";
import getDeepiestLastChild from "../../../../../../../elementsUtils/getDeepiesLastChild";
import getFocusNode from "../../../../../../../elementsUtils/getFocusNode";
import getNodeByPos from "../../../../../../../elementsUtils/getNodeByPos";
import isTypeOf from "../../../../../../../elementsUtils/isTypeOf";
import KeyboardRule from "../../../../../../../elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "../../../../../../../elementsUtils/keyboardShortcuts/model/KeyboardShortcut";

const getTabShortcuts = (): KeyboardShortcut => {
	return {
		key: "Tab",
		rules: [moveInListBefore, insideCodeBlock],
	};
};

const moveInListBefore: KeyboardRule = ({ editor, node, nodePosition }) => {
	const getListBeforeLastListItem = () => {
		const listBefore = getNodeByPos(parentNode.position - 1, editor.state.doc);
		if (!listBefore?.node) return;
		if (!isTypeOf(listBefore.node, listTypes)) return;
		const listBeforeDeepiestChildPos = getDeepiestLastChild(listBefore.node, listBefore.position).position;
		return getNodeByPos(listBeforeDeepiestChildPos, editor.state.doc, (node) => node === listBefore.node.lastChild);
	};

	const { tr } = editor.view.state;
	const focusOffset = editor.state.selection.anchor - nodePosition;
	const parentNode = getFocusNode(editor.state, (node) => isTypeOf(node, listTypes));
	const isFocusOnFirstListItem = parentNode.node.firstChild.eq(node);
	if (!isFocusOnFirstListItem) return;
	const listBeforeLastListItem = getListBeforeLastListItem();
	if (!listBeforeLastListItem) return;

	tr.delete(parentNode.position, parentNode.position + parentNode.node.nodeSize);
	tr.insert(listBeforeLastListItem.position + listBeforeLastListItem.node.nodeSize - 1, parentNode.node);

	editor.view.dispatch(tr);
	editor.commands.focus(listBeforeLastListItem.position + listBeforeLastListItem.node.nodeSize + focusOffset);

	return true;
};

const insideCodeBlock: KeyboardRule = ({ editor, typeName }) => {
	const { node } = getFocusNode(editor.state, (node) => isTypeOf(node, "code_block"));
	if (node) return false;
	return editor.commands.sinkListItem(typeName);
};

export default getTabShortcuts;
