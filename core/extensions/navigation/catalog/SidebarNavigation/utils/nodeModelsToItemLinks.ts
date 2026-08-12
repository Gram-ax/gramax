import type { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import type { NodeModel } from "@minoru/react-dnd-treeview";

export const nodeModelsToItemLinks = (nodes: NodeModel<ItemLink>[], rootId: string | number): ItemLink[] => {
	const nodesById = new Map(nodes.map((node) => [node.id, node]));
	const childrenByParent = new Map<string | number, NodeModel<ItemLink>[]>();

	for (const node of nodes) {
		if (node.parent === null) continue;
		const siblings = childrenByParent.get(node.parent) ?? [];
		siblings.push(node);
		childrenByParent.set(node.parent, siblings);
	}

	const rebuild = (nodeId: string | number): ItemLink => {
		const node = nodesById.get(nodeId)!;
		const children = (childrenByParent.get(nodeId) ?? []).map((child) => rebuild(child.id));
		return Array.isArray((node.data as CategoryLink).items) || children.length > 0
			? ({ ...node.data, items: children } as CategoryLink)
			: (node.data as ItemLink);
	};

	return (childrenByParent.get(rootId) ?? []).map((node) => rebuild(node.id));
};
