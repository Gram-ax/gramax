import { Extension } from "@tiptap/core";
import getTabShortcuts from "@ext/markdown/logic/keys/global/tab";
import getShiftTabShortcuts from "@ext/markdown/logic/keys/global/shiftTab";
import getBackspaceShortcuts from "@ext/markdown/logic/keys/global/backspace";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import getEnterShortcuts from "@ext/markdown/logic/keys/global/enter";
import getShiftEnterShortcuts from "@ext/markdown/logic/keys/global/shiftEnter";

const DocKeyboardShortcuts = Extension.create({
	name: "DocKeyboardShortcuts",
	priority: 10000,

	addKeyboardShortcuts() {
		return addShortcuts([
			getTabShortcuts(),
			getShiftTabShortcuts(),
			getBackspaceShortcuts(),
			getEnterShortcuts(),
			getShiftEnterShortcuts(),
		]);
	},
});

export default DocKeyboardShortcuts;
