import { listTypes } from "@ext/markdown/elements/joinLists/joinLists";
import getNodeByPos from "@ext/markdown/elementsUtils/getNodeByPos";
import isTypeOf from "@ext/markdown/elementsUtils/isTypeOf";
import { ChainedCommands, Editor } from "@tiptap/core";

const toggleListPrepare = (editor: Editor, chain: ChainedCommands) => {
	const { from, to } = editor.state.selection;
	const doc = editor.state.doc;
	const toggledNodesPositions: number[] = [];

	doc.nodesBetween(from, to, (_, pos) => {
		const nodeInfo = getNodeByPos(pos, doc, (n) => isTypeOf(n, ["heading"]));

		if (nodeInfo.node && !toggledNodesPositions.includes(nodeInfo.position)) {
			const isInListItem = !!getNodeByPos(pos, doc, (n) => isTypeOf(n, ["listItem"])).node;
			if (isInListItem) return;

			toggledNodesPositions.push(nodeInfo.position);
			chain.setNodeSelection(nodeInfo.position);
			chain.toggleNode("heading", "paragraph");
		}
	});

	let firstTopLevel: { pos: number; nodeSize: number; name: string } | null = null;
	let hasFollowingTopLevel = false;

	doc.nodesBetween(from, to, (node, pos, parent) => {
		if (parent?.type?.name !== "doc" || hasFollowingTopLevel) return;
		if (!firstTopLevel) {
			firstTopLevel = { pos, nodeSize: node.nodeSize, name: node.type.name };
			return;
		}
		hasFollowingTopLevel = true;
	});

	const listPositions: { pos: number; size: number; content: number }[] = [];

	if (firstTopLevel && listTypes.includes(firstTopLevel.name) && hasFollowingTopLevel) {
		const start = Math.max(from, firstTopLevel.pos + 1);
		doc.nodesBetween(start, to, (node, pos, parent) => {
			if (parent?.type?.name !== "doc" || !listTypes.includes(node.type.name)) return;

			listPositions.push({ pos, size: node.nodeSize, content: node.children.length });
		});

		listPositions
			.sort((a, b) => b.pos - a.pos)
			.forEach((itemPos) => {
				const from = itemPos.pos + 2;
				chain.setTextSelection({ from, to: from + itemPos.size - 4 });
				chain.liftListItem("listItem");
			});
	}

	const shouldRun = toggledNodesPositions.length > 0 || listPositions.length > 0;
	const selectFromStart = from === doc.firstChild.content.size + 2;
	if (shouldRun || selectFromStart) {
		const shiftBecauseDelete = listPositions.length > 0 ? 2 : 0; //bulletListStart + listItemStart
		const shiftFrom = shiftBecauseDelete - (selectFromStart ? 2 : 0);
		const shiftTo =
			(listPositions.reduce((shift, { content }) => (shift += content), 0) + listPositions.length) * 2;
		chain
			.setTextSelection({
				from: from - shiftFrom,
				to: to - shiftTo + shiftBecauseDelete + 2,
			})
			.run();
	}
	return chain;
};

export default toggleListPrepare;
