import { Instance, Props } from "tippy.js";

export const isCommentBlockDirty = (instance: Instance<Props>) => {
	const comment = instance.popper;
	const editableElement = comment.querySelectorAll("div[contenteditable='true'].tiptap");
	if (editableElement.length > 1) return true;

	const element = editableElement[0];
	if (element.childElementCount > 1) return true;

	const firstElement = element.firstElementChild as HTMLElement;
	return !firstElement.dataset["placeholder"];
};
