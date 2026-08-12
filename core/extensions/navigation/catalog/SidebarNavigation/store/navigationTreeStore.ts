import type { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { DropMode, type PersistedDropMode } from "../utils/dropMode";

export type DragTarget = {
	anchorId: string;
	parentId: string | null;
	mode: DropMode;
} | null;

const EMPTY_DRAG_LINE_IDS: ReadonlySet<string> = new Set();

const sameDragTarget = (left: DragTarget, right: DragTarget): boolean =>
	left === right ||
	(!!left &&
		!!right &&
		left.anchorId === right.anchorId &&
		left.parentId === right.parentId &&
		left.mode === right.mode);

const getDragLineIds = (target: DragTarget, childrenMap: ChildrenMap): ReadonlySet<string> => {
	if (target?.mode !== DropMode.After || !target.parentId) return EMPTY_DRAG_LINE_IDS;
	const siblings = childrenMap[target.parentId];
	if (!siblings) return EMPTY_DRAG_LINE_IDS;
	const anchorIndex = siblings.indexOf(target.anchorId);
	return anchorIndex < 0 ? EMPTY_DRAG_LINE_IDS : new Set(siblings.slice(0, anchorIndex + 1));
};

// Flat index built from the nested ItemLink tree
export type FlatIndex = Record<string, ItemLink>;
export type ChildrenMap = Record<string, string[]>; // parentPath → childPaths[]
export type ParentMap = Record<string, string>; // childPath → parentPath

export type NavigationTreeStore = {
	scope: string | null;
	flatIndex: FlatIndex;
	childrenMap: ChildrenMap;
	parentMap: ParentMap;
	rootIds: string[];
	expanded: ReadonlySet<string>;
	selectedId: string;
	hoveredParentId: string | null;
	hoveredAnchorId: string | null;
	draggingId: string | null;
	dragTarget: DragTarget;
	dragLineIds: ReadonlySet<string>;
	isDragLocked: boolean;
	onDrop: ((draggedId: string, anchorId: string, mode: PersistedDropMode) => Promise<void>) | null;
	onToggle: ((id: string, open: boolean) => void) | null;
	onCreateArticle: ((parentId?: string, afterId?: string) => Promise<void>) | null;
	setDragLocked: (locked: boolean) => void;
	toggleExpanded: (id: string, open: boolean) => void;
	select: (id: string) => void;
	setHover: (parentId: string | null, anchorId: string | null) => void;
	setDragging: (id: string | null) => void;
	setDragTarget: (target: DragTarget) => void;
	setNavItems: (links: ItemLink[], scope?: string) => void;
	setOnDrop: (fn: NavigationTreeStore["onDrop"]) => void;
	setOnToggle: (fn: NavigationTreeStore["onToggle"]) => void;
	setOnCreateArticle: (fn: NavigationTreeStore["onCreateArticle"]) => void;
};

const sameItem = (a: ItemLink | undefined, b: ItemLink): boolean =>
	!!a &&
	a.type === b.type &&
	a.title === b.title &&
	a.icon === b.icon &&
	a.isCurrentLink === b.isCurrentLink &&
	a.pathname === b.pathname &&
	a.external === b.external &&
	a.status === b.status &&
	(a as CategoryLink).isExpanded === (b as CategoryLink).isExpanded &&
	(a as CategoryLink).existContent === (b as CategoryLink).existContent;

const sameIds = (a: string[] | undefined, b: string[]): boolean =>
	!!a && a.length === b.length && a.every((id, i) => id === b[i]);

export const buildFlatIndex = (
	links: ItemLink[],
	previous: FlatIndex,
	previousChildren: ChildrenMap,
	previousParents: ParentMap,
) => {
	const flatIndex: FlatIndex = {};
	const childrenMap: ChildrenMap = {};
	const parentMap: ParentMap = {};

	const visit = (link: ItemLink) => {
		const id = link.ref.path;
		flatIndex[id] = sameItem(previous[id], link) ? previous[id] : link;

		const children = (link as CategoryLink).items ?? [];
		const childIds = children.map((c) => c.ref.path);
		childrenMap[id] = sameIds(previousChildren[id], childIds) ? previousChildren[id] : childIds;

		children.forEach((child) => {
			parentMap[child.ref.path] = id;
			visit(child);
		});
	};

	const rootIds = links.map((link) => {
		visit(link);
		return link.ref.path;
	});

	const sameMap = <T>(before: Record<string, T>, after: Record<string, T>): boolean => {
		const keys = Object.keys(after);
		return keys.length === Object.keys(before).length && keys.every((key) => before[key] === after[key]);
	};

	return {
		flatIndex: sameMap(previous, flatIndex) ? previous : flatIndex,
		childrenMap: sameMap(previousChildren, childrenMap) ? previousChildren : childrenMap,
		parentMap: sameMap(previousParents, parentMap) ? previousParents : parentMap,
		rootIds,
	};
};

export const reconcileExpansion = (
	nextIndex: FlatIndex,
	previousIndex: FlatIndex,
	previousExpanded: ReadonlySet<string>,
): { expanded: Set<string>; selectedId: string } => {
	const expanded = new Set(previousExpanded);
	let selectedId = "";

	for (const link of Object.values(nextIndex)) {
		const id = link.ref.path;
		if (!previousIndex[id] && (link as CategoryLink).isExpanded) expanded.add(id);
		if (link.isCurrentLink) selectedId = id;
	}

	for (const id of previousExpanded) if (!nextIndex[id]) expanded.delete(id);

	return { expanded, selectedId };
};

/** The store itself. Use it for imperative reads outside React — `navigationTreeStore.getState()`. */
export const navigationTreeStore = create<NavigationTreeStore>((set) => ({
	scope: null,
	flatIndex: {},
	childrenMap: {},
	parentMap: {},
	rootIds: [],
	expanded: new Set<string>(),
	selectedId: "",
	hoveredParentId: null,
	hoveredAnchorId: null,
	draggingId: null,
	dragTarget: null,
	dragLineIds: EMPTY_DRAG_LINE_IDS,
	isDragLocked: false,
	onDrop: null,
	onToggle: null,
	onCreateArticle: null,

	toggleExpanded: (id, open) =>
		set((state) => {
			state.onToggle?.(id, open);
			const next = new Set(state.expanded);
			if (open) next.add(id);
			else {
				const stack = [id];
				while (stack.length) {
					const current = stack.pop()!;
					next.delete(current);
					for (const child of state.childrenMap[current] ?? []) stack.push(child);
				}
			}
			return { expanded: next };
		}),

	select: (id) =>
		set((state) => {
			state.onToggle?.(id, true);
			const next = new Set(state.expanded);
			next.add(id);
			return { selectedId: id, expanded: next };
		}),

	setHover: (parentId, anchorId) =>
		set((state) => {
			if (state.hoveredParentId === parentId && state.hoveredAnchorId === anchorId) return state;
			return { hoveredParentId: parentId, hoveredAnchorId: anchorId };
		}),

	setDragging: (id) => set({ draggingId: id, dragTarget: null, dragLineIds: EMPTY_DRAG_LINE_IDS }),

	setDragTarget: (target) =>
		set((state) =>
			sameDragTarget(state.dragTarget, target)
				? state
				: { dragTarget: target, dragLineIds: getDragLineIds(target, state.childrenMap) },
		),

	setNavItems: (links, scope) =>
		set((state) => {
			const nextScope = scope ?? state.scope;
			const scopeChanged = nextScope !== state.scope;
			const previousIndex = scopeChanged ? {} : state.flatIndex;
			const previousChildren = scopeChanged ? {} : state.childrenMap;
			const previousParents = scopeChanged ? {} : state.parentMap;
			const previousExpanded = scopeChanged ? new Set<string>() : state.expanded;
			const { flatIndex, childrenMap, parentMap, rootIds } = buildFlatIndex(
				links,
				previousIndex,
				previousChildren,
				previousParents,
			);

			const { expanded, selectedId } = reconcileExpansion(flatIndex, previousIndex, previousExpanded);

			return {
				scope: nextScope,
				flatIndex,
				childrenMap,
				dragLineIds: scopeChanged ? EMPTY_DRAG_LINE_IDS : getDragLineIds(state.dragTarget, childrenMap),
				parentMap,
				rootIds: !scopeChanged && sameIds(state.rootIds, rootIds) ? state.rootIds : rootIds,
				expanded,
				selectedId,
				...(scopeChanged && {
					hoveredParentId: null,
					hoveredAnchorId: null,
					draggingId: null,
					dragTarget: null,
					isDragLocked: false,
				}),
			};
		}),

	setDragLocked: (locked) => set({ isDragLocked: locked }),
	setOnDrop: (fn) => set({ onDrop: fn }),
	setOnToggle: (fn) => set({ onToggle: fn }),
	setOnCreateArticle: (fn) => set({ onCreateArticle: fn }),
}));

export const useNavigationTreeStore = <T>(selector: (state: NavigationTreeStore) => T): T =>
	navigationTreeStore(useShallow(selector));
