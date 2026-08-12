import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import Localizer from "@ext/localization/core/Localizer";
import type { ContentLanguage } from "@ext/localization/core/model/Language";
import type { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import type { NodeModel } from "@minoru/react-dnd-treeview";
import { useCallback, useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

type Overrides = { [categoryPath: string]: boolean };
type NavTreeStateDto = { [catalogName: string]: Overrides };

const EMPTY: Overrides = {};
const EMPTY_LANGUAGES: ContentLanguage[] = [];

interface NavTreeStore {
	catalogs: NavTreeStateDto;
	setCatalogOverrides: (catalogName: string, overrides: Overrides) => void;
}

const STORAGE_KEY = "nav-tree-state";
const STORAGE_VERSION = 1;

export const migrateNavTreeState = (): { catalogs: NavTreeStateDto } => ({ catalogs: {} });

const isSSR = typeof window === "undefined";

// SSR (docportal) has no localStorage; persist must degrade to an in-memory no-op there
const noopStorage: StateStorage = {
	getItem: () => null,
	setItem: () => undefined,
	removeItem: () => undefined,
};

const isOverrides = (value: unknown): value is Overrides =>
	!!value && typeof value === "object" && !Array.isArray(value);

const overrideKey = (path: string, supportedLanguages?: ContentLanguage[]): string =>
	Localizer.stripLanguage(path, supportedLanguages ?? []);

export const useNavTreeStore = create<NavTreeStore>()(
	persist(
		(set) => ({
			catalogs: {},
			setCatalogOverrides: (catalogName, overrides) =>
				set((s) => ({ catalogs: { ...s.catalogs, [catalogName]: overrides } })),
		}),
		{
			name: STORAGE_KEY,
			version: STORAGE_VERSION,
			storage: createJSONStorage(() => (isSSR ? noopStorage : window.localStorage)),
			partialize: (s) => ({ catalogs: s.catalogs }),
			migrate: migrateNavTreeState,
		},
	),
);

export const getCatalogOverrides = (catalogName: string): Overrides => {
	const stored = useNavTreeStore.getState().catalogs?.[catalogName];
	return isOverrides(stored) ? stored : EMPTY;
};

const setCatalogOverrides = (catalogName: string, overrides: Overrides): void =>
	useNavTreeStore.getState().setCatalogOverrides(catalogName, overrides);

export const applyOverrides = (
	items: ItemLink[],
	overrides: Overrides,
	supportedLanguages?: ContentLanguage[],
): ItemLink[] => {
	let changed = false;
	const next = items.map((item) => {
		if (item.type !== ItemType.category) return item;
		const cat = item as CategoryLink;
		const isExpanded = overrides[overrideKey(cat.ref.path, supportedLanguages)] ?? cat.isExpanded;
		const children = cat.items ?? [];
		const nextChildren = applyOverrides(children, overrides, supportedLanguages);
		if (isExpanded === cat.isExpanded && nextChildren === children) return item;
		changed = true;
		return { ...cat, isExpanded, items: nextChildren };
	});
	return changed ? next : items;
};

const collectCategoryKeys = (items: ItemLink[], supportedLanguages?: ContentLanguage[]): Set<string> => {
	const keys = new Set<string>();
	const walk = (items: ItemLink[]) => {
		for (const item of items) {
			if (item.type !== ItemType.category) continue;
			const cat = item as CategoryLink;
			keys.add(overrideKey(cat.ref.path, supportedLanguages));
			walk(cat.items ?? []);
		}
	};
	walk(items);
	return keys;
};

export const setCategoryOverride = (
	catalogName: string,
	path: string,
	open: boolean,
	supportedLanguages?: ContentLanguage[],
): void => {
	if (!catalogName) return;
	const key = overrideKey(path, supportedLanguages);
	const next: Overrides = { ...getCatalogOverrides(catalogName), [key]: open };
	if (!open) {
		const subtreePrefix = key.endsWith(CATEGORY_ROOT_FILENAME) ? key.slice(0, -CATEGORY_ROOT_FILENAME.length) : key;
		for (const k of Object.keys(next)) if (k !== key && k.startsWith(subtreePrefix)) next[k] = false;
	}
	setCatalogOverrides(catalogName, next);
};

export const syncOverrides = (catalogName: string, items: ItemLink[], supportedLanguages?: ContentLanguage[]): void => {
	if (!catalogName || !items.length) return;
	const overrides = getCatalogOverrides(catalogName);
	const valid = collectCategoryKeys(items, supportedLanguages);
	let next: Overrides | null = null;
	const mutable = (): Overrides => {
		if (!next) next = { ...overrides };
		return next;
	};

	for (const key of Object.keys(overrides)) if (!valid.has(key)) delete mutable()[key];

	const persistExpanded = (list: ItemLink[], level: number) => {
		for (const item of list) {
			if (item.type !== ItemType.category) continue;
			const cat = item as CategoryLink;
			const key = overrideKey(cat.ref.path, supportedLanguages);
			if (level > 0 && cat.isExpanded && !(key in overrides)) mutable()[key] = true;
			persistExpanded(cat.items ?? [], level + 1);
		}
	};
	persistExpanded(items, 0);

	if (next) setCatalogOverrides(catalogName, next);
};

export const expandParentOf = (path: string, supportedLanguages?: ContentLanguage[]): void => {
	const { catalogName, itemLogicPath } = RouterPathProvider.parsePath(path);
	if (!catalogName || !itemLogicPath) return;

	const parentDirs = itemLogicPath.slice(1, -1);
	if (!parentDirs.length) return;

	const parentPath = [catalogName, ...parentDirs, CATEGORY_ROOT_FILENAME].join("/");
	const key = overrideKey(parentPath, supportedLanguages);
	const overrides = getCatalogOverrides(catalogName);
	if (!(key in overrides)) return;
	const { [key]: _removed, ...rest } = overrides;
	setCatalogOverrides(catalogName, rest);
};

const findNewDraggedPath = (nodes: NodeModel<ItemLink>[], draggedPath: string): string | undefined => {
	const folder = draggedPath.split("/").slice(-2, -1)[0];
	return nodes.find(
		(n) =>
			n.data?.ref?.path &&
			n.data.ref.path !== draggedPath &&
			n.data.ref.path.split("/").slice(-2, -1)[0] === folder,
	)?.data?.ref?.path;
};

export const reconcileDroppedNodes = (
	catalogName: string,
	previousNodes: NodeModel<ItemLink>[],
	droppedNodes: NodeModel<ItemLink>[],
	draggedPath: string,
	supportedLanguages?: ContentLanguage[],
): NodeModel<ItemLink>[] => {
	const overrides = getCatalogOverrides(catalogName);
	const newDraggedPath = findNewDraggedPath(droppedNodes, draggedPath);
	const wasDraggedExpanded =
		overrides[overrideKey(draggedPath, supportedLanguages)] ??
		!!(previousNodes.find((n) => n.data?.ref?.path === draggedPath)?.data as CategoryLink)?.isExpanded;

	return droppedNodes.map((node) => {
		if (!node.data?.ref?.path || node.data.type !== ItemType.category) return node;
		const cat = node.data as CategoryLink;
		const effective =
			node.data.ref.path === newDraggedPath && wasDraggedExpanded
				? true
				: (overrides[overrideKey(node.data.ref.path, supportedLanguages)] ?? cat.isExpanded);
		if (effective === cat.isExpanded) return node;
		return { ...node, data: { ...node.data, isExpanded: effective } as ItemLink };
	});
};

export const useNavTreePersistence = (
	catalogName: string,
	items: ItemLink[],
	supportedLanguages: ContentLanguage[] = EMPTY_LANGUAGES,
) => {
	const effectiveItems = useMemo(() => {
		// SSR renders the tree as-is: no persisted state to sync, and writing the
		// module-level store during server render would leak state across requests
		if (isSSR) return items;
		syncOverrides(catalogName, items, supportedLanguages);
		return applyOverrides(items, getCatalogOverrides(catalogName), supportedLanguages);
	}, [catalogName, items, supportedLanguages]);

	const toggle = useCallback(
		(path: string, open: boolean) => setCategoryOverride(catalogName, path, open, supportedLanguages),
		[catalogName, supportedLanguages],
	);

	const reconcileDrop = (
		previousNodes: NodeModel<ItemLink>[],
		droppedNodes: NodeModel<ItemLink>[],
		draggedPath: string,
	) => reconcileDroppedNodes(catalogName, previousNodes, droppedNodes, draggedPath, supportedLanguages);

	return { effectiveItems, toggle, reconcileDrop };
};
