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
	let findPath: string = null;

	const find = (node: Node, pos: number, parentNode: Node, path: string) => {
		const isCurrent = anchor >= pos && anchor < pos + node.nodeSize;
		if (node?.content)
			node.content.forEach((n, offset, idx) => {
				find(n, pos + offset + 1, node, path + "/" + idx);
			});
		if (!isCurrent) return;
		if (!filter(node, parentNode)) return;
		if (isDeepest && findNode) return;
		findParentNode = parentNode;
		findNode = node;
		position = pos;
		findPath = path;
		return;
	};

	doc.content.forEach((n, offset, idx) => {
		find(n, offset, doc, idx.toString());
	});

	return { node: findNode, position, parentNode: findParentNode, path: findPath };
};

export default getNodeByPos;
