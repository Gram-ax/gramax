import { Node } from "prosemirror-model";

const getNodeByPos = (
	anchor: number,
	doc: Node,
	filter: (node: Node, parentNode?: Node) => boolean = () => true,
	isDeepest = true,
) => {
	let findNode: Node = null;
	let findParentNode: Node = null;
	let position: number;

	const find = (node: Node, pos: number, parentNode: Node) => {
		const isCurrent = anchor >= pos && anchor < pos + node.nodeSize;
		if (node?.content)
			node.content.forEach((n, offset) => {
				find(n, pos + offset + 1, node);
			});
		if (!isCurrent) return;
		if (!filter(node, parentNode)) return;
		if (isDeepest && findNode) return;
		findParentNode = parentNode;
		findNode = node;
		position = pos;
		return;
	};

	doc.content.forEach((n, offset) => {
		find(n, offset, doc);
	});

	return { node: findNode, position, parentNode: findParentNode };
};

export default getNodeByPos;
