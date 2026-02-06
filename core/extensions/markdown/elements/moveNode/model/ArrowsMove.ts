import getMoveNode from "@ext/markdown/elements/moveNode/edit/logic/moveFunctions";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import { Extension } from "@tiptap/core";

const ArrowsMove = Extension.create({
	name: "ArrowsMove",

	addKeyboardShortcuts() {
		return addShortcuts([getMoveNode("Mod-ArrowUp"), getMoveNode("Mod-ArrowDown")], this.name);
	},
});

export default ArrowsMove;
