import type { Editor } from "@tiptap/core";

export const handleEnter = (editor: Editor) => {
	const { $from } = editor.state.selection;
	if ($from.parent.type.name !== "heading") return false;
	if ($from.parentOffset === 0) return false;
	if ($from.parentOffset + 2 === $from.parent.nodeSize) return false;

	return editor.chain().focus().splitBlock().toggleNode("paragraph", "heading").run();
};
