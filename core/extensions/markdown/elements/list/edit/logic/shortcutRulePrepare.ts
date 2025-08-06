import getNodeByPos from "@ext/markdown/elementsUtils/getNodeByPos";
import isTypeOf from "@ext/markdown/elementsUtils/isTypeOf";
import { Editor } from "@tiptap/core";

const shortcutRulePrepare = (editor: Editor) => {
	const { from, to } = editor.state.selection;
	const doc = editor.state.doc;
	const chain = editor.chain();
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

	if (toggledNodesPositions.length > 0) chain.setTextSelection({ from, to });
	return chain;
};

export default shortcutRulePrepare;
