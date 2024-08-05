import KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "../../../../../../../elementsUtils/keyboardShortcuts/model/KeyboardShortcut";

const backspace: KeyboardRule = ({ editor }) => {
	const { tr } = editor.state;
	const { from, to, empty } = tr.selection;

	if (empty) return false;

	if (!editor.view.dispatch) return false;

	tr.delete(from, to);
	editor.view.dispatch(tr);

	return true;
};

const selectionBackspace = (): KeyboardShortcut => {
	return { key: "Delete", rules: [backspace] };
};

export default selectionBackspace;
