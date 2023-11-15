import { NodeModel } from "@minoru/react-dnd-treeview";

type TreeNode<T = unknown> = {
	model: NodeModel<T>;
	children: TreeNode<T>[];
};

export type Movement<T = unknown> = {
	oldList: NodeModel<T>[];
	newList: NodeModel<T>[];
	moveItem: NodeModel<T>;
};

const getMovements = <T>(oldNav: NodeModel<T>[], newNav: NodeModel<T>[]): Movement<T>[] => {
	const oldTreeRoots = buildTree(oldNav);
	const newTreeRoots = buildTree(newNav);
	const movements: Movement<T>[] = [];

	newNav.forEach((moveItem) => {
		const oldList = getPathForNode<T>(moveItem, oldTreeRoots);
		const newList = getPathForNode<T>(moveItem, newTreeRoots);

		if (oldList && newList && oldList.map((m) => m.id).join() !== newList.map((m) => m.id).join()) {
			movements.push({ moveItem, newList, oldList });
		}
	});

	return movements;
};

const buildTree = <T>(nodes: NodeModel<T>[]): TreeNode<T>[] => {
	const idToNodeMap = new Map<number | string, TreeNode<T>>();

	nodes.forEach((node) => {
		idToNodeMap.set(node.id, { model: node, children: [] });
	});

	const roots: TreeNode<T>[] = [];

	nodes.forEach((node) => {
		const treeNode = idToNodeMap.get(node.id);
		if (node.parent === null || node.parent === undefined || !idToNodeMap.has(node.parent)) {
			roots.push(treeNode);
		} else {
			const parentNode = idToNodeMap.get(node.parent);
			parentNode.children.push(treeNode);
		}
	});

	return roots;
};

const getModelToNode = <T>(node: NodeModel<T>, tree: TreeNode<T>): NodeModel<T>[] => {
	if (tree.model.id === node.id) {
		return [tree.model];
	}

	for (const child of tree.children) {
		const path = getModelToNode(node, child);
		if (path) {
			return [tree.model, ...path];
		}
	}

	return null;
};

const getPathForNode = <T>(node: NodeModel<T>, treeRoots: TreeNode<T>[]): NodeModel<T>[] => {
	for (const root of treeRoots) {
		const models = getModelToNode<T>(node, root);
		if (models) return models;
	}
	return null;
};

export default getMovements;
