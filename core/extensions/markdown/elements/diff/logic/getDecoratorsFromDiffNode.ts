import { DiffNode } from "@ext/markdown/elements/diff/edit/model/DiffItemTypes";
import getNodeFromPath from "@ext/markdown/elementsUtils/getNodeFromPath";
import { Decoration } from "@tiptap/pm/view";
import { Node } from "prosemirror-model";

function getDecoratorsFromDiffNode(oldDoc: Node, newDoc: Node, diffNodes: DiffNode[]) {
	const addedDecorations: Decoration[] = [];
	const removedDecorations: Decoration[] = [];
	const changedContextDecorations: Decoration[] = [];

	diffNodes.forEach((diffNode) => {
		if (diffNode.block) {
			if (diffNode.diffType === "added") {
				const nodeInfo = getNodeFromPath(newDoc, diffNode.path);
				const from = nodeInfo.position;
				const to = from + nodeInfo.node.nodeSize;
				addedDecorations.push(Decoration.node(from, to, { class: "added-text-block" }));
			} else if (diffNode.diffType === "deleted") {
				const nodeInfo = getNodeFromPath(oldDoc, diffNode.path);
				const from = nodeInfo.position;
				const to = from + nodeInfo.node.nodeSize;
				removedDecorations.push(Decoration.node(from, to, { class: "removed-text-block" }));
			} else {
				const nodeInfo = getNodeFromPath(newDoc, diffNode.path);
				const from = nodeInfo.position;
				const to = from + nodeInfo.node.nodeSize;
				changedContextDecorations.push(Decoration.node(from, to, { class: "changed-context-block" }));
			}
		} else {
			if (diffNode.diffType === "added") {
				const nodeInfo = getNodeFromPath(newDoc, diffNode.path);
				const from = nodeInfo.position + 1 + diffNode.relativeFrom; // +1 because paragraph and text offset
				const to = from + (diffNode.relativeTo - diffNode.relativeFrom);
				addedDecorations.push(Decoration.inline(from, to, { class: "added-text" }));
			} else if (diffNode.diffType === "deleted") {
				const nodeInfo = getNodeFromPath(oldDoc, diffNode.path);
				const from = nodeInfo.position + 1 + diffNode.relativeFrom; // +1 because paragraph and text offset
				const to = from + (diffNode.relativeTo - diffNode.relativeFrom);
				removedDecorations.push(Decoration.inline(from, to, { class: "removed-text" }));
			} else {
				const nodeInfo = getNodeFromPath(newDoc, diffNode.path);
				const from = nodeInfo.position + 1 + diffNode.relativeFrom; // +1 because paragraph and text offset
				const to = from + (diffNode.relativeTo - diffNode.relativeFrom);
				changedContextDecorations.push(Decoration.inline(from, to, { class: "changed-context" }));
			}
		}
	});
	return { addedDecorations, removedDecorations, changedContextDecorations };
}

export default getDecoratorsFromDiffNode;
