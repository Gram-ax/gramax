import KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardShortcut";

const backSpace: KeyboardRule = ({ editor }) => {
	const { selection } = editor.state;

	if (selection.from === selection.to && selection.$from.parent.isBlock) {
		if (selection.$from.parentOffset === 0 && selection.$from.parent.textContent.length) {
			return editor.commands.deleteCurrentNode();
		}
	}

	return false;
};
const getBackspaceShortcuts = (): KeyboardShortcut => {
	return {
		key: "Backspace",
		rules: [backSpace],
	};
};

export default getBackspaceShortcuts;
