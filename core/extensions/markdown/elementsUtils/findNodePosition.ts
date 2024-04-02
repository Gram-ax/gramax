import { Node } from "prosemirror-model";

function findNodePosition(node: Node, doc: Node) {
	let found = null;

	doc.descendants((child, pos) => {
		if (child === node) {
			found = pos;
			return false;
		}
	});

	return found;
}

export default findNodePosition;
