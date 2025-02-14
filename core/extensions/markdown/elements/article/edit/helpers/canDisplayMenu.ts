import { Editor } from "@tiptap/core";

const canDisplayMenu = (editor: Editor) => {
	const { selection } = editor.view.state;
	const isFirst = selection.$from.parent === editor.view.state.doc.firstChild;
	const isSelectedFullyDoc =
		selection.$from.parent.type.name === "doc" && !selection.$from.parent.maybeChild(1).textContent;

	return isFirst || isSelectedFullyDoc;
};

export default canDisplayMenu;
