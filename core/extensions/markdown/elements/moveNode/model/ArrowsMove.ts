import { Extension } from "@tiptap/core";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import getMoveNode from "@ext/markdown/elements/moveNode/edit/logic/moveFunctions";

const ArrowsMove = Extension.create({
	name: "ArrowsMove",

	addKeyboardShortcuts() {
		return addShortcuts([getMoveNode("Mod-ArrowUp"), getMoveNode("Mod-ArrowDown")], this.name);
	},
});

export default ArrowsMove;
