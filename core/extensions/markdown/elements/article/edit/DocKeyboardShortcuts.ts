import { Extension } from "@tiptap/core";
import getTabShortcuts from "@ext/markdown/logic/keys/global/tab";
import getShiftTabShortcuts from "@ext/markdown/logic/keys/global/shiftTab";
import getBackspaceShortcuts from "@ext/markdown/logic/keys/global/backspace";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";

const DocKeyboardShortcuts = Extension.create({
	name: "DocKeyboardShortcuts",

	addKeyboardShortcuts() {
		return addShortcuts([getTabShortcuts(), getShiftTabShortcuts(), getBackspaceShortcuts()]);
	},
});

export default DocKeyboardShortcuts;
