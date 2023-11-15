import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import isTypeOf from "@ext/markdown/elementsUtils/isTypeOf";
import KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardShortcut";

const insideCodeBlock: KeyboardRule = ({ editor, typeName }) => {
	const { node } = getFocusNode(editor.state, (node) => isTypeOf(node, "code_block"));
	if (node) return false;
	return editor.commands.splitListItem(typeName);
};

const contentOnlySpaces: KeyboardRule = ({ editor, typeName, node, nodePosition }) => {
	const hasStrOnlySpaces = (str: string) => str.trim().length === 0;

	const listItemDifference = 2;
	const content = node.textContent;

	if (hasStrOnlySpaces(content)) {
		const tr = editor.state.tr;
		const from = nodePosition + listItemDifference;
		const to = nodePosition + node.nodeSize - listItemDifference;

		tr.delete(from, to);
		editor.view.dispatch(tr);

		return editor.commands.liftListItem(typeName);
	}

	return false;
};

const getEnterShortcuts = (): KeyboardShortcut => {
	return {
		key: "Enter",
		rules: [contentOnlySpaces, insideCodeBlock],
	};
};

export default getEnterShortcuts;
