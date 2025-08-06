import getFocusMark from "@ext/markdown/elementsUtils/getFocusMark";
import KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";
import { UnionCommands } from "@tiptap/core";

const arrowRight = (toggleCommand: keyof UnionCommands): KeyboardRule => {
	return ({ typeName, editor }) => {
		if (!editor.isActive(typeName)) return false;

		const { position } = getFocusMark(editor.state, typeName);
		if (!position) return false;

		const markNode = editor.state.doc.nodeAt(position);
		if (!markNode) return false;
		const selection = editor.state.selection;
		const hasSelection = selection.from !== selection.to;

		if (selection.anchor === position - 1 + markNode.text.length && !hasSelection) {
			return (editor.commands[toggleCommand] as () => boolean)();
		}
		return false;
	};
};

export default arrowRight;
