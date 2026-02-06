import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import { Extension } from "@tiptap/core";
import getEnterShortcuts from "../logit/keys/Enter";

const TableKeyboardShortcuts = Extension.create({
	name: "TableKeyboardShortcuts",

	addKeyboardShortcuts() {
		return addShortcuts([getEnterShortcuts()], "tableRow");
	},
});

export default TableKeyboardShortcuts;
