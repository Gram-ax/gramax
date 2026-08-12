import type { ChildrenMap } from "../store/navigationTreeStore";

export const isDescendant = (childrenMap: ChildrenMap, ancestorId: string, nodeId: string): boolean => {
	const children = childrenMap[ancestorId] ?? [];

	for (const childId of children) {
		if (childId === nodeId || isDescendant(childrenMap, childId, nodeId)) return true;
	}

	return false;
};
