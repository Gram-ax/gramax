import { Transaction } from "prosemirror-state";

const titleRule = (transaction: Transaction): boolean => {
	const doc = transaction.doc;
	const selection = transaction.selection;
	const titleNode = doc.firstChild;

	return selection.from >= 0 && selection.to <= titleNode.nodeSize;
};

export default titleRule;
