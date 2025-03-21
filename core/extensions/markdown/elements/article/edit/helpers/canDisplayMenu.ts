import { Editor } from "@tiptap/core";

const canDisplayMenu = (editor: Editor) => {
	const { selection } = editor.view.state;
	const doc = editor.view.state.doc;
	const isFirst = selection.$from.parent === doc.firstChild;
	const isSelectedFullyDoc =
		selection.$from.parent.type.name === "doc" && !doc.maybeChild(1).textContent && doc.childCount === 2;

	return isFirst || isSelectedFullyDoc;
};

export default canDisplayMenu;
