import { listTypes } from "@ext/markdown/elements/list/edit/logic/toggleList";
import { Node as ProseMirrorNode } from "prosemirror-model";
import getDeepiestLastChild from "../../../../../../../elementsUtils/getDeepiesLastChild";
import getFocusNode from "../../../../../../../elementsUtils/getFocusNode";
import getSelectedText from "../../../../../../../elementsUtils/getSelectedText";
import isTypeOf from "../../../../../../../elementsUtils/isTypeOf";
import KeyboardRule from "../../../../../../../elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "../../../../../../../elementsUtils/keyboardShortcuts/model/KeyboardShortcut";
import { isFocusOnStartListNode } from "./utils";

const getBackspaceShortcuts = (): KeyboardShortcut => {
	return { key: "Backspace", rules: [onHighestLevel, insideList, stickToLastListItem] };
};

const onHighestLevel: KeyboardRule = ({ editor, typeName, node, nodePosition }) => {
	const state = editor.state;
	const hasSelection = !!getSelectedText(editor.state);
	const { node: listParentNode, parentNode: listGrandparentNode } = getFocusNode(state, (node) =>
		isTypeOf(node, listTypes),
	);

	if (!listParentNode || !node) return false;

	if (
		isFocusOnStartListNode(state, nodePosition) &&
		listParentNode.firstChild === node &&
		!isTypeOf(listGrandparentNode, typeName) &&
		!hasSelection
	) {
		return editor.chain().liftListItem(typeName).run();
	} else return false;
};

const insideList: KeyboardRule = ({ editor, typeName, parentNode, nodePosition: position }) => {
	if (parentNode.childCount == 1 && isFocusOnStartListNode(editor.state, position)) {
		return editor.chain().liftListItem(typeName).joinBackward().run();
	} else return false;
};

const stickToLastListItem: KeyboardRule = ({ editor, node, nodePosition }) => {
	const findBrotherBefore = (
		node: ProseMirrorNode,
		parentNode: ProseMirrorNode,
		parentPosition: number,
	): { brotherBefore: ProseMirrorNode; position: number } => {
		let position: number;
		let offsetBefore: number;
		let brotherBefore: ProseMirrorNode;
		parentNode.forEach((child, offset, idx) => {
			if (brotherBefore !== undefined) return;
			if (child === node) {
				brotherBefore = idx == 0 ? null : parentNode.child(idx - 1);
				position = idx == 0 ? null : parentPosition + offsetBefore + 1;
			}
			offsetBefore = offset;
		});
		return { brotherBefore, position };
	};

	const { node: paragraphFocusNode, position: paragraphPosition } = getFocusNode(editor.state, (node) =>
		isTypeOf(node, ["paragraph"]),
	);
	const isFocusOnStartParagraph = editor.state.selection.anchor === paragraphPosition + 1;
	if (!isFocusOnStartParagraph || getSelectedText(editor.state)) return;

	const { brotherBefore, position: brotherBeforePosition } = findBrotherBefore(
		paragraphFocusNode,
		node,
		nodePosition,
	);

	if (!brotherBefore || !isTypeOf(brotherBefore, listTypes)) return;

	const { node: textNode, position: textNodePos } = getDeepiestLastChild(brotherBefore, brotherBeforePosition);
	const end = textNodePos + textNode.nodeSize;

	return editor
		.chain()
		.deleteNode(paragraphFocusNode.type.name)
		.insertContentAt(end, { type: "paragraph", content: paragraphFocusNode.content.toJSON() })
		.focus(textNode.textContent.length ? end : end - 1)
		.joinForward()
		.run();
};

export default getBackspaceShortcuts;
