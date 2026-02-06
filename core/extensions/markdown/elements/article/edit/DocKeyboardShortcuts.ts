import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import getBackspaceShortcuts from "@ext/markdown/logic/keys/global/backspace";
import getEnterShortcuts from "@ext/markdown/logic/keys/global/enter";
import getShiftEnterShortcuts from "@ext/markdown/logic/keys/global/shiftEnter";
import getShiftTabShortcuts from "@ext/markdown/logic/keys/global/shiftTab";
import getTabShortcuts from "@ext/markdown/logic/keys/global/tab";
import { Extension } from "@tiptap/core";

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
