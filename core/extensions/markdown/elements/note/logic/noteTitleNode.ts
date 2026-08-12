import type { Node } from "@tiptap/pm/model";

export const NOTE_TITLE_NODE = "noteTitle";

const toSingleLine = (value: string): string => value.replace(/\r?\n/g, " ");

export const getNoteTitle = (node: Node): string => {
	const first = node.firstChild;
	if (first?.type.name === NOTE_TITLE_NODE) return toSingleLine(first.textContent);
	return (node.attrs.title as string) ?? "";
};

export const getNoteBody = (node: Node): Node => {
	const first = node.firstChild;
	if (first?.type.name !== NOTE_TITLE_NODE) return node;
	return node.copy(node.content.cut(first.nodeSize));
};
