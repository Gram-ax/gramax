import { DiffNode } from "@ext/markdown/elements/diff/edit/model/DiffItemTypes";
import { DiffLine } from "@ext/markdown/elements/diff/logic/DiffExtension";
import getNodeFromPath from "@ext/markdown/elementsUtils/getNodeFromPath";
import { Editor } from "@tiptap/core";
import { Decoration } from "@tiptap/pm/view";

const listNodes = ["listItem", "taskItem", "orderedList", "bulletList", "taskList"];
const tableNodes = [
	"table",
	"tableRow",
	"tableHeader",
	"tableCell",
	"table_simple",
	"tableHeaderRow_simple",
	"tableBodyRow_simple",
	"tableHeader_simple",
	"tableCell_simple",
];
const tabsNodes = ["tab", "tabs"];
const nodesCanIncludeParagraph = ["cut", "note", "unsupported", "blockquote", "code_block"];

function shouldSkipNode(nodeName: string) {
	return [...listNodes, ...tableNodes, ...tabsNodes, ...nodesCanIncludeParagraph].includes(nodeName);
}

function getDecoratorsFromDiffNode(oldEditor: Editor, newEditor: Editor, diffNodes: DiffNode[]) {
	const oldDoc = oldEditor.state.doc;
	const newDoc = newEditor.state.doc;
	const addedDecorations: Decoration[] = [];
	const removedDecorations: Decoration[] = [];
	const changedContextDecorations: Decoration[] = [];

	const model: DiffLine[] = [];

	diffNodes.forEach((diffNode) => {
		if (diffNode.block) {
			if (diffNode.diffType === "added") {
				const nodeInfo = getNodeFromPath(newDoc, diffNode.path);
				if (shouldSkipNode(nodeInfo.node.type.name)) return;

				const from = nodeInfo.position;
				const to = from + nodeInfo.node.nodeSize;
				model.push({ type: "added", startPos: from, endPos: to });
			} else if (diffNode.diffType === "deleted") {
				// todo: подумать как хендлить
				const nodeInfo = getNodeFromPath(oldDoc, diffNode.path);
				if (shouldSkipNode(nodeInfo.node.type.name)) return;
				const from = nodeInfo.position;
				const to = from + nodeInfo.node.nodeSize;
				model.push({
					type: "deleted",
					startPos: from,
					endPos: to,
				});
				removedDecorations.push(Decoration.node(from, to, { class: "deleted-text-block" }));
			} else {
				const nodeInfo = getNodeFromPath(newDoc, diffNode.path);
				if (shouldSkipNode(nodeInfo.node.type.name)) return;
				const from = nodeInfo.position;
				const to = from + nodeInfo.node.nodeSize;
				model.push({
					type: "modified",
					startPos: from,
					endPos: to,
					nodeBefore: undefined,
				});
			}
		} else {
			if (diffNode.relativeFrom === 0 && diffNode.relativeTo === 0) return;
			if (diffNode.diffType === "added") {
				const nodeInfo = getNodeFromPath(newDoc, diffNode.path);
				const from = nodeInfo.position + 1 + diffNode.relativeFrom; // +1 because paragraph and text offset
				const to = from + (diffNode.relativeTo - diffNode.relativeFrom);
				// todo: подумать надо ли добавлять (-2)
				const isBlockAdded = diffNode.relativeFrom === 0 && diffNode.relativeTo === nodeInfo.node.nodeSize;
				if (isBlockAdded) {
					model.push({
						type: "added",
						startPos: nodeInfo.position,
						endPos: nodeInfo.position + nodeInfo.node.nodeSize,
					});
				} else {
					const deletedNodeInfo = diffNode.deletedDiffNode
						? getNodeFromPath(oldDoc, diffNode.deletedDiffNode.path)
						: undefined;

					addedDecorations.push(Decoration.inline(from, to, { class: "added-text" }));
					model.push({
						type: "modified",
						startPos: nodeInfo.position,
						endPos: nodeInfo.position + nodeInfo.node.nodeSize,
						nodeBefore: {
							content: deletedNodeInfo?.node.toJSON(),
							relativeFrom: diffNode.deletedDiffNode?.relativeFrom,
							relativeTo: diffNode.deletedDiffNode?.relativeTo,
						},
					});
				}
			} else if (diffNode.diffType === "deleted") {
				const nodeInfo = getNodeFromPath(oldDoc, diffNode.path);
				const from = nodeInfo.position + 1 + diffNode.relativeFrom; // +1 because paragraph and text offset
				const to = from + (diffNode.relativeTo - diffNode.relativeFrom);
				removedDecorations.push(Decoration.inline(from, to, { class: "deleted-text" }));
			} else {
				const nodeInfo = getNodeFromPath(newDoc, diffNode.path);
				model.push({
					type: "modified",
					startPos: nodeInfo.position,
					endPos: nodeInfo.position + nodeInfo.node.nodeSize,
					nodeBefore: undefined,
				});
			}
		}
	});
	const filteredModel: DiffLine[] = [];
	model.forEach((diffLine) => {
		if (
			filteredModel.find(
				(x) => x.startPos === diffLine.startPos && x.endPos === diffLine.endPos && x.type === diffLine.type,
			)
		)
			return;
		filteredModel.push(diffLine);
	});
	// todo: сделать удаление
	newEditor.commands.updateDiffLinesModel(filteredModel.filter((x) => x.type !== "deleted"));

	return { addedDecorations, removedDecorations, changedContextDecorations };
}

export default getDecoratorsFromDiffNode;
