import type KeyboardShortcut from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardShortcut";
import beforeArticleTitle from "@ext/markdown/logic/keys/global/backspace/beforeArticleTitle";
import betweenNoteOrCut from "@ext/markdown/logic/keys/global/backspace/betweenNoteOrCut";
import dontMergeNotes from "@ext/markdown/logic/keys/global/backspace/dontMergeNotes";
import focusOnPrevousBlockNode from "@ext/markdown/logic/keys/global/backspace/focusOnPrevousBlockNode";
import headingAfterNode from "@ext/markdown/logic/keys/global/backspace/headingAfterNode";

const getBackspaceShortcuts = (): KeyboardShortcut => {
	return {
		key: "Backspace",
		rules: [betweenNoteOrCut, headingAfterNode, focusOnPrevousBlockNode, beforeArticleTitle, dontMergeNotes],
	};
};

export default getBackspaceShortcuts;
