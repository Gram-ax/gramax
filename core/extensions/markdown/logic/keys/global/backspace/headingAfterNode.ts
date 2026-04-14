import getNodeByPos from "@ext/markdown/elementsUtils/getNodeByPos";
import isTypeOf from "@ext/markdown/elementsUtils/isTypeOf";
import type KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";

const headingAfterNode: KeyboardRule = ({ editor, nodePosition, node }): boolean => {
	const selection = editor.state.selection;

	if (nodePosition <= 3 || selection.from !== selection.to) return false;

	const isEmptyHeading = node.type.name === "heading" && !node.content.content.length;
	if (!(nodePosition === selection.from || isEmptyHeading)) return false;

	const doc = editor.state.doc;
	const headingPosition = isEmptyHeading ? nodePosition : nodePosition - 1;
	const headingNode = doc.nodeAt(headingPosition);
	if (!headingNode || headingNode.type.name !== "heading") return false;

	const nodeBefore = getNodeByPos(headingPosition - 1, doc, (node) => isTypeOf(node, ["note", "listItem"]));
	if (!nodeBefore?.node) return false;

	return editor.chain().toggleHeading({ level: headingNode.attrs.level }).run();
};

export default headingAfterNode;
