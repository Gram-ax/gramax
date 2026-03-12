import { type Editor, findParentNode, isAtStartOfNode } from "@tiptap/core";
import { editName } from "../../../consts";

export const handleBackspace = ({ editor }: { editor: Editor }) => {
	const parentNode = findParentNode((node) => node.type.name === editName)(editor.state.selection);
	if (!parentNode) return false;
	if (!isAtStartOfNode(editor.state)) return false;
	if (
		parentNode.node.content.childCount !== 1 ||
		(parentNode.node.content.firstChild?.type.name === "paragraph" && parentNode.node.textContent.length !== 0)
	)
		return false;

	return editor
		.chain()
		.deleteRange({
			from: parentNode.pos,
			to: parentNode.pos + parentNode.node.nodeSize,
		})
		.focus(parentNode.pos - 2)
		.run();
};
