import { Extension } from "@tiptap/core";

import getEnterShortcuts from "../logit/keys/Enter";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";

const TableKeyboardShortcuts = Extension.create({
	name: "TableKeyboardShortcuts",

	addKeyboardShortcuts() {
		return addShortcuts([getEnterShortcuts()], "tableRow");
	},
});

export default TableKeyboardShortcuts;
