import { Node } from "prosemirror-model";

const getDeepiestLastChild = (
	node: Node,
	position: number,
	filter?: (node: Node) => boolean,
): { node: Node; position: number; parentNode: Node } => {
	let findNode: Node = null;
	let findParentNode: Node = null;
	let findPosition: number = null;

	const find = (node: Node, pos: number, parentNode: Node): void => {
		if (node.content) {
			node.content.forEach((n, offset, index) => {
				if (index == node.childCount - 1) find(n, pos + offset + 1, node);
			});
		}
		if (filter && !filter(node)) return;
		if (findNode) return;

		findNode = node;
		findParentNode = parentNode;
		findPosition = pos;
	};
	find(node, position, null);
	return { node: findNode, position: findPosition, parentNode: findParentNode };
};
export default getDeepiestLastChild;
