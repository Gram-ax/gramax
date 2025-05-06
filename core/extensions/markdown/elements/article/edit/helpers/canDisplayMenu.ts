import { Editor } from "@tiptap/core";
import checkBlockField from "@ext/markdown/elements/controllers/helpers/checkBlockField";

const isInTitle = (editor: Editor) => {
	const { selection } = editor.view.state;
	const doc = editor.view.state.doc;
	const titleNode = doc.firstChild;

	return selection.from >= 0 && selection.to <= titleNode.nodeSize;
};

const isTemplateInstance = (dom: HTMLElement) => {
	return dom.getAttribute("is-template") === "true";
};

const canDisplayMenu = (editor: Editor) => {
	if (!editor.isEditable) return true;

	const isFirst = isInTitle(editor);
	const isTemplate = isTemplateInstance(editor.view.dom);

	if (isTemplate && !isFirst && !checkBlockField(editor.view.state.selection)) return true;

	const { selection } = editor.view.state;
	const doc = editor.view.state.doc;
	const isSelectedFullyDoc =
		selection.$from.parent.type.name === "doc" && !doc.maybeChild(1).textContent && doc.childCount === 2;

	return isFirst || isSelectedFullyDoc;
};

export default canDisplayMenu;
