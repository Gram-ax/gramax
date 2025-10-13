import { selectedRect } from "prosemirror-tables";
import KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardShortcut";
import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import isTypeOf from "@ext/markdown/elementsUtils/isTypeOf";

const quitTableOnDoubleEnder: KeyboardRule = ({ editor }) => {
	const { state } = editor;
	const { selection, doc } = state;
	const { $from } = selection;

	const rect = selectedRect(state);
	if (rect.bottom !== rect.map.height) return false;

	const info = getFocusNode(state, (n) => isTypeOf(n, "table"));
	if (!info) return false;
	const { node: tableNode, position: tablePos } = info;

	let cellDepth = -1;
	for (let d = $from.depth; d >= 0; d--) {
		const name = $from.node(d).type.name;
		if (name === "tableCell") {
			cellDepth = d;
			break;
		}
	}
	if (cellDepth === -1) return false;

	const cellPos = $from.before(cellDepth);
	const cellNode = doc.nodeAt(cellPos);

	if (!cellNode || cellNode.content.childCount < 2) return false;

	const lastBlock = cellNode.lastChild;
	const lastIsEmpty = lastBlock.textContent.trim() === "";

	const atEndOfBlock = selection.empty && $from.parent.isTextblock && $from.pos === $from.end();
	const isInLastBlock = $from.parent === lastBlock;
	if (!atEndOfBlock || !isInLastBlock || !lastIsEmpty) return false;

	let lastOffset = 0;
	cellNode.content.forEach((_n, offset) => {
		lastOffset = offset;
	});
	const delFrom = cellPos + 1 + lastOffset;
	const delTo = delFrom + lastBlock.nodeSize;

	const afterTable = tablePos + tableNode.nodeSize;
	const inserted = editor
		.chain()
		.insertContentAt(afterTable, { type: "paragraph" })
		.setTextSelection(afterTable + 1)
		.run();

	if (!inserted) return false;

	return editor.chain().deleteRange({ from: delFrom, to: delTo }).run();
};

const getEnterShortcuts = (): KeyboardShortcut => {
	return { key: "Enter", rules: [quitTableOnDoubleEnder] };
};

export default getEnterShortcuts;
