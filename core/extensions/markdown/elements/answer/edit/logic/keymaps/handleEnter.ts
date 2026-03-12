import { type Editor, findParentNode, isAtEndOfNode } from "@tiptap/core";
import { editName } from "../../../consts";

export const handleEnter = ({ editor }: { editor: Editor }) => {
	const parentNode = findParentNode((node) => node.type.name === editName)(editor.state.selection);
	if (!parentNode) return false;
	if (!isAtEndOfNode(editor.state)) return false;
	if (
		parentNode.node.content.childCount === 1 &&
		parentNode.node.content.firstChild?.type.name === "paragraph" &&
		parentNode.node.textContent.length === 0
	)
		return false;

	return editor.commands.addQuestionAnswer({
		correct: null,
	});
};
