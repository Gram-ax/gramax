import isTemplateEditableBlock from "@ext/markdown/elements/controllers/helpers/isTemplateEditableBlock";
import { Editor } from "@tiptap/core";

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
	if (!editor.isEditable) return false;

	const isFirst = isInTitle(editor);
	const isTemplate = isTemplateInstance(editor.view.dom);

	if (isTemplate && !isFirst && !isTemplateEditableBlock(editor.view.state.selection)) return false;
	if (isFirst) return false;

	return true;
};

export default canDisplayMenu;
