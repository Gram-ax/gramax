import getNodeByPos from "@ext/markdown/elementsUtils/getNodeByPos";
import KeyboardRulesProps from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRulesProps";
import KeyboardShortcut from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardShortcut";
import { Editor } from "@tiptap/core";
import { TextSelection, Transaction } from "@tiptap/pm/state";
import { Node } from "prosemirror-model";

const listTypes = ["bullet_list", "ordered_list"];

type NodesWithParent = { node: Node; pos: number; parent: Node }[];

type NodesWithoutChildren = { node: Node; pos: number }[];

interface MoveProps {
	editor: Editor;
	isUp: boolean;
	anchor: number;
	doc: Node;
	tr: Transaction;
}

const getPrevAndNextNodeSize = (doc: Node, node: Node) => {
	let prev: Node;
	let nextNodeSize = 0;
	let prevNodeSize = 0;
	let nextState = false;

	doc.content.forEach((n, _, index) => {
		if (nextState) {
			nextNodeSize = n.nodeSize;
			nextState = false;
		}

		if (n == node) {
			nextState = true;
			prevNodeSize = prev?.nodeSize;

			if (index === 0) prevNodeSize = 0;
			if (doc.content.childCount === index + 1) nextState = false;
		}

		prev = n;
	});

	return {
		nextNodeSize,
		prevNodeSize,
	};
};

const swapNodes = (
	tr: Transaction,
	pos1: number,
	pos2: number,
	firstNodeSize: number,
	secondNodeSize: number,
	nodeDifference = 0,
) => {
	const range1 = { start: pos1 + nodeDifference, end: pos1 + firstNodeSize };
	const range2 = { start: pos2 + nodeDifference, end: pos2 + secondNodeSize };
	if (!range1 || !range2) return;

	const slice1 = tr.doc.slice(range1.start, range1.end);
	const slice2 = tr.doc.slice(range2.start, range2.end);

	if (range1.start > range2.start) {
		tr.replaceRange(range1.start, range1.end, slice2);
		tr.replaceRange(range2.start, range2.end, slice1);
	} else {
		tr.replaceRange(range2.start, range2.end, slice1);
		tr.replaceRange(range1.start, range1.end, slice2);
	}
};

const getMainListItem = ({ editor }: { editor: Editor }) => {
	const anchor = editor.state.selection.anchor;
	const doc = editor.state.doc;

	const { node: parentNode, position } = getNodeByPos(anchor, doc, (_, parentNode) => parentNode === doc);
	const { childNodes, childLists: childsList } = getChildNodesAndParent(parentNode);

	return { childNodes, childLists: childsList, position, anchor };
};

const getNodesAndPos = ({
	childNodes,
	anchor,
	parentListPos,
}: {
	childNodes: NodesWithoutChildren;
	anchor: number;
	parentListPos: number;
}) => {
	const posInList = anchor - parentListPos;

	let prevPos: number = null;
	let prevForEachPos: number = null;

	let nextNodePos: number = null;
	let curNodePos: number = null;
	let prevNodePos: number = null;

	let nextNode: Node = null;
	let curNode: Node = null;
	let prevNode: Node = null;

	childNodes.forEach(({ pos }) => {
		if (nextNodePos === null && posInList <= pos) {
			nextNodePos = pos;
		}
		if (posInList > prevPos && posInList < pos) {
			curNodePos = prevPos;
			prevNodePos = prevForEachPos;
		}
		if (pos < posInList) {
			curNodePos = pos;
			prevNodePos = prevPos;
		}

		prevForEachPos = prevPos;
		prevPos = pos;
	});

	childNodes.forEach(({ node, pos }) => {
		if (nextNodePos === pos) nextNode = node;
		if (curNodePos === pos) curNode = node;
		if (prevNodePos === pos) prevNode = node;
	});

	return {
		prevNode,
		curNode,
		nextNode,
		prevNodePos,
		curNodePos,
		nextNodePos,
	};
};

function getChildNodesAndParent(parent: Node) {
	const childNodes: NodesWithParent = [];
	const nodesWithoutChildren: NodesWithoutChildren = [];
	const childLists: NodesWithParent = [];

	parent.descendants((node, pos, parent) => {
		if (node.type.name === "list_item") childNodes.push({ node, pos, parent });
		if (listTypes.includes(node.type.name)) childLists.push({ node, pos, parent });
	});

	parent.content.forEach((node, pos) => {
		nodesWithoutChildren.push({ node, pos });
	});

	return { childNodes, childLists, nodesWithoutChildren };
}

function getParentPosFromChildList(nodes: NodesWithoutChildren, listItem: Node, pos: number) {
	let parentPos = pos;
	nodes.forEach(({ node, pos }) => {
		if (node === listItem) parentPos += pos;
	});

	return parentPos;
}

const swapListItem = ({ editor, isUp, anchor, doc, tr }: MoveProps) => {
	const listDifference = 2;
	const { position: mainListPos, childLists } = getMainListItem({ editor });

	const { parentNode: listItemParent } = getNodeByPos(anchor, doc, (_, parentNode) =>
		listTypes.includes(parentNode.type.name),
	);

	const { nodesWithoutChildren } = getChildNodesAndParent(listItemParent);

	const parentPos = getParentPosFromChildList(childLists, listItemParent, mainListPos);

	const { prevNode, curNode, nextNode, prevNodePos, curNodePos, nextNodePos } = getNodesAndPos({
		anchor,
		childNodes: nodesWithoutChildren,
		parentListPos: parentPos,
	});

	if ((isUp && !prevNode) || (!isUp && !nextNode)) return tr;

	const swapPos = parentPos + (isUp ? prevNodePos : nextNodePos);
	const swapNode = isUp ? prevNode : nextNode;
	const focusPos = isUp ? anchor - prevNode.nodeSize : anchor + nextNode.nodeSize;

	swapNodes(tr, parentPos + curNodePos, swapPos, curNode.nodeSize, swapNode.nodeSize, listDifference);

	tr.setSelection(TextSelection.create(tr.doc, focusPos));

	return tr;
};

const swapNode = ({ isUp, anchor, doc, tr }: MoveProps) => {
	const { node, position } = getNodeByPos(anchor, doc, (_, parentNode): boolean => parentNode === doc);

	const { prevNodeSize, nextNodeSize } = getPrevAndNextNodeSize(doc, node);

	if (!position && isUp) return tr;
	if (!nextNodeSize && !isUp) return tr;

	const upPosition = position - prevNodeSize;
	const downPosition = position + node.nodeSize;

	const upFocusPos = anchor - prevNodeSize;
	const downFocusPos = anchor + nextNodeSize;

	const swapPos = isUp ? upPosition : downPosition;
	const swapFocusPos = isUp ? upFocusPos : downFocusPos;

	const firstNode = tr.doc.nodeAt(swapPos);
	const secondNode = tr.doc.nodeAt(position);

	swapNodes(tr, swapPos, position, firstNode.nodeSize, secondNode.nodeSize);
	tr.setSelection(TextSelection.create(tr.doc, swapFocusPos));

	return tr;
};

const swap = ({ editor, isUp }: { isUp: boolean; editor: Editor }) => {
	const anchor = editor.state.selection.anchor;
	const doc = editor.state.doc;
	const cursor = editor.state.selection.$from;

	const markerDifference = 3;

	const { position } = getNodeByPos(anchor, doc, (_, parentNode): boolean => parentNode === doc);
	const props = { editor, isUp, anchor, doc, tr: editor.state.tr };

	const isList = cursor.depth >= 3 ? cursor.node(-1).type.name === "list_item" : false;
	const firstListNode = position + markerDifference < anchor;

	const tr = isList && firstListNode ? swapListItem(props) : swapNode(props);
	if (tr.docChanged) editor.view.dispatch(tr);

	return true;
};

const getMoveNode = (key: "Mod-ArrowDown" | "Mod-ArrowUp"): KeyboardShortcut => {
	const isUp = key === "Mod-ArrowUp";

	return {
		key,
		focusShouldBeInsideNode: false,
		rules: [({ editor }: KeyboardRulesProps) => swap({ editor, isUp })],
	};
};

export default getMoveNode;
