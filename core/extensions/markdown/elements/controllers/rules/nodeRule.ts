import { NodeSelection, Transaction } from "prosemirror-state";
import { editName as blockFieldEditName } from "@ext/markdown/elements/blockContentField/consts";

const allowedNodes = ["inline-property", blockFieldEditName];
const nodeRule = (transaction: Transaction): boolean => {
	const selection = transaction.selection;

	if (selection instanceof NodeSelection && allowedNodes.includes(selection.node.type.name)) {
		return true;
	}
};

export default nodeRule;
