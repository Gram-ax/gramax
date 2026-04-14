import { ItemType } from "@core/FileStructue/Item/ItemType";
import type { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import { useCallback, useMemo, useRef } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type NavTreeStateDto = { [catalogName: string]: string[] };

interface NavTreeStore {
	catalogs: NavTreeStateDto;
	setCatalog: (catalogName: string, openPaths: string[]) => void;
}

export const useNavTreeStore = create<NavTreeStore>()(
	persist(
		(set) => ({
			catalogs: {},
			setCatalog: (catalogName, openPaths) =>
				set((s) => ({ catalogs: { ...s.catalogs, [catalogName]: openPaths } })),
		}),
		{ name: "nav-tree-state", partialize: (s) => ({ catalogs: s.catalogs }) },
	),
);

export const collectExpandedPaths = (items: ItemLink[], level = 0): string[] => {
	const paths: string[] = [];
	for (const item of items) {
		if (item.type !== ItemType.category) continue;
		const cat = item as CategoryLink;
		const isOpen = level === 0 || !!cat.isExpanded;
		if (isOpen) {
			paths.push(cat.ref.path);
			paths.push(...collectExpandedPaths(cat.items ?? [], level + 1));
		}
	}
	return paths;
};

const collectServerHints = (items: ItemLink[]): string[] => {
	const hints: string[] = [];
	const walk = (items: ItemLink[], level: number) => {
		for (const item of items) {
			if (item.type !== ItemType.category) continue;
			const cat = item as CategoryLink;
			if (level > 0 && cat.isExpanded) hints.push(cat.ref.path);
			walk(cat.items ?? [], level + 1);
		}
	};
	walk(items, 0);
	return hints;
};

const collectDescendantPaths = (items: ItemLink[], parentPath: string): string[] => {
	const result: string[] = [];
	const walk = (items: ItemLink[], inside: boolean) => {
		for (const item of items) {
			if (item.type !== ItemType.category) continue;
			const cat = item as CategoryLink;
			const isTarget = cat.ref.path === parentPath;
			if (inside) result.push(cat.ref.path);
			walk(cat.items ?? [], inside || isTarget);
		}
	};
	walk(items, false);
	return result;
};

const collectAllCategoryPaths = (items: ItemLink[]): Set<string> => {
	const paths = new Set<string>();
	const walk = (items: ItemLink[]) => {
		for (const item of items) {
			if (item.type !== ItemType.category) continue;
			const cat = item as CategoryLink;
			paths.add(cat.ref.path);
			walk(cat.items ?? []);
		}
	};
	walk(items);
	return paths;
};

export const syncCatalogState = (catalogName: string, items: ItemLink[]): void => {
	const { catalogs } = useNavTreeStore.getState();
	if (!(catalogName in catalogs)) return;
	const serverHints = collectServerHints(items);
	const saved = catalogs[catalogName] ?? [];
	const savedSet = new Set(saved);
	for (const hint of serverHints) savedSet.add(hint);

	const validPaths = collectAllCategoryPaths(items);
	for (const path of savedSet) {
		if (!validPaths.has(path)) savedSet.delete(path);
	}

	if (savedSet.size !== saved.length || [...savedSet].some((p) => !saved.includes(p))) {
		useNavTreeStore.getState().setCatalog(catalogName, [...savedSet]);
	}
};

export const getOpenPaths = (catalogName: string): string[] | null => {
	const { catalogs } = useNavTreeStore.getState();
	return catalogName in catalogs ? catalogs[catalogName] : null;
};

export const applyNavTreeState = (catalogName: string, items: ItemLink[]): ItemLink[] => {
	const { catalogs } = useNavTreeStore.getState();
	if (!(catalogName in catalogs)) return items;
	const saved = new Set(catalogs[catalogName]);
	const apply = (items: ItemLink[]): ItemLink[] =>
		items.map((item) => {
			if (item.type !== ItemType.category) return item;
			const cat = item as CategoryLink;
			return { ...cat, isExpanded: saved.has(cat.ref.path), items: apply(cat.items ?? []) };
		});
	return apply(items);
};

export const useNavTreePersistence = (catalogName: string, items: ItemLink[]) => {
	const openPathsRef = useRef<Set<string>>(null);
	if (openPathsRef.current === null) {
		openPathsRef.current = new Set(getOpenPaths(catalogName) ?? collectExpandedPaths(items));
	}

	const prevItemsRef = useRef(items);
	if (items !== prevItemsRef.current) {
		prevItemsRef.current = items;
		if (items.length && catalogName) {
			syncCatalogState(catalogName, items);
			openPathsRef.current = new Set(getOpenPaths(catalogName) ?? collectExpandedPaths(items));
		}
	}

	const effectiveItems = useMemo(
		() => (catalogName ? applyNavTreeState(catalogName, items) : items),
		[items, catalogName],
	);

	const handleToggle = useCallback(
		(refPath: string, toggled: boolean) => {
			if (toggled) {
				openPathsRef.current.add(refPath);
			} else {
				openPathsRef.current.delete(refPath);
				for (const desc of collectDescendantPaths(items, refPath)) {
					openPathsRef.current.delete(desc);
				}
			}
			useNavTreeStore.getState().setCatalog(catalogName, [...openPathsRef.current]);
		},
		[catalogName, items],
	);

	return { effectiveItems, handleToggle, openPathsRef };
};
