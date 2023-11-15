import { UnionCommands } from "@tiptap/core";
import KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";
import getFocusMark from "@ext/markdown/elementsUtils/getFocusMark";

const arrowRight = (toggleCommand: keyof UnionCommands): KeyboardRule => {
	return ({ typeName, editor }) => {
		if (!editor.isActive(typeName)) return false;

		const { position } = getFocusMark(editor.state, typeName);
		if (!position) return false;

		const markNode = editor.state.doc.nodeAt(position);
		const selection = editor.state.selection;
		const hasSelection = selection.from !== selection.to;

		if (selection.anchor === position - 1 + markNode.text.length && !hasSelection) {
			return (editor.commands[toggleCommand] as () => boolean)();
		} else return false;
	};
};

export default arrowRight;
