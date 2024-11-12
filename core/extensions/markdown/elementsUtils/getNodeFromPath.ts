import { Node } from "prosemirror-model";

const getNodeFromPath = (doc: Node, path: string) => {
	const pathArray = path.split("/").map((x) => parseInt(x));
	let findNode: Node = null;
	let findParentNode: Node = null;
	let position: number;
	let founded = false;

	const find = (node: Node, pos: number, parentNode: Node, path: number[]) => {
		if (founded) return;
		if (path.length && !node.content) return;

		if (!path.length) {
			findParentNode = parentNode;
			findNode = node;
			position = pos;
			founded = true;
			return;
		}

		if (node?.content) {
			const pathIdx = pathArray.shift();
			node.content.forEach((n, offset, idx) => {
				if (pathIdx !== idx) return;
				find(n, pos + offset + 1, node, path);
			});
		}
	};

	const pathIdx = pathArray.shift();
	doc.content.forEach((n, offset, idx) => {
		if (pathIdx !== idx) return;
		find(n, offset, doc, pathArray);
	});

	return { node: findNode, position, parentNode: findParentNode };
};

export default getNodeFromPath;
