import { useCallback, useMemo } from "react";
import { useNavigationTreeStore } from "../store/navigationTreeStore";
import { useCreateArticle } from "./useCreateArticle";

export function useInsertionLineState(id: string, level: number, isFolder: boolean, open: boolean) {
	const { childrenMap, parentMap, setHover, isAnchor } = useNavigationTreeStore((s) => ({
		childrenMap: s.childrenMap,
		parentMap: s.parentMap,
		setHover: s.setHover,
		isAnchor: s.hoveredAnchorId === id,
	}));

	const showsLine = useNavigationTreeStore((s) => {
		const { hoveredParentId, hoveredAnchorId, childrenMap: cm, rootIds: roots } = s;
		if (!hoveredParentId || !hoveredAnchorId) return false;
		if (roots.includes(hoveredParentId)) return false;
		const siblings = cm[hoveredParentId] ?? [];
		const myIndex = siblings.indexOf(id);
		if (myIndex < 0) return false;
		const anchorIndex = siblings.indexOf(hoveredAnchorId);
		return anchorIndex >= 0 && myIndex <= anchorIndex;
	});

	const isOpenFolder = isFolder && open;

	const { minDepth, maxDepth, getParentId } = useMemo(() => {
		let minDepth = 1;
		let maxDepth: number;
		let getParentId: (targetDepth: number) => string | null;
		if (isOpenFolder) {
			minDepth = level + 1;
			maxDepth = level + 1;
			getParentId = () => id;
		} else {
			let curId = id;
			let curLevel = level;
			while (curLevel > 1) {
				const pid = parentMap[curId];
				if (!pid) break;
				const siblings = childrenMap[pid] ?? [];
				if (siblings.at(-1) !== curId) {
					minDepth = curLevel;
					break;
				}
				curId = pid;
				curLevel--;
			}
			maxDepth = level + 1;
			getParentId = (targetDepth) => {
				if (targetDepth > level) return id;
				let cur = id;
				let depth = level;
				while (depth > targetDepth) {
					const pid = parentMap[cur];
					if (!pid) break;
					cur = pid;
					depth--;
				}
				return parentMap[cur] ?? null;
			};
		}

		return { minDepth, maxDepth, getParentId };
	}, [isOpenFolder, level, id, parentMap, childrenMap?.[id]]);

	const handleParentHover = useCallback(
		(depth: number | null) => {
			if (depth === null) setHover(null, null);
			else setHover(getParentId(depth), getParentId(depth + 1));
		},
		[setHover, getParentId],
	);

	const createArticle = useCreateArticle();

	const getAfterId = useCallback(
		(targetDepth: number): string | undefined => {
			if (isOpenFolder) return undefined;
			let cur = id;
			let depth = level;
			while (depth > targetDepth) {
				const pid = parentMap[cur];
				if (!pid) break;
				cur = pid;
				depth--;
			}
			return cur;
		},
		[id, level, isOpenFolder, parentMap],
	);

	const handleAdd = useCallback(
		(targetDepth: number) => createArticle(getParentId(targetDepth) ?? undefined, getAfterId(targetDepth)),
		[createArticle, getParentId, getAfterId],
	);

	return { minDepth, maxDepth, handleAdd, handleParentHover, showsLine, isAnchor };
}
