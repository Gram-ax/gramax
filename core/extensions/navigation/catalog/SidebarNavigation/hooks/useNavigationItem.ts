import { useNavigationTreeStore } from "../store/navigationTreeStore";

// Stable reference: `?? []` inside the selector would allocate a new array on every call and make
// zustand's Object.is check fail, re-rendering every leaf on any store change.
const NO_CHILDREN: string[] = [];

export const useNavigationItem = (id: string) => {
	const { data, children, open, isSelected, toggleExpanded, select } = useNavigationTreeStore((s) => ({
		data: s.flatIndex[id],
		children: s.childrenMap[id] ?? NO_CHILDREN,
		open: s.expanded.has(id),
		isSelected: s.selectedId === id,
		toggleExpanded: s.toggleExpanded,
		select: s.select,
	}));

	return { data, children, open, isSelected, toggleExpanded, select };
};
