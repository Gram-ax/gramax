import type { ReviewListItem, ReviewScope } from "@ext/review/models/ReviewList";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

export type ReviewSortingOrder = "none" | "newest" | "oldest";

export type ReviewGrouping = "none" | "article" | "date";

type ReviewFilters = {
	afterDate?: string;
	beforeDate?: string;
	authors?: string[];
	pathname?: string[];
};

const STORE_VERSION = 1;

const STORE_NAME = "review-state";

interface ReviewStore {
	catalogItems: ReviewListItem[];
	articleItems: ReviewListItem[];
	currentItem: ReviewListItem;
	currentScope: ReviewScope;
	pendingItem: ReviewListItem;
	filters: ReviewFilters;
	sorting: ReviewSortingOrder;
	grouping: ReviewGrouping;
	pathnameToTitle: Record<string, string>;
	searchQuery: string;

	setCatalogItems: (items: ReviewListItem[]) => void;
	setArticleItems: (items: ReviewListItem[]) => void;
	setCurrentItem: (item: ReviewListItem) => void;
	setCurrentScope: (scope: ReviewScope) => void;
	setPendingItem: (item: ReviewListItem) => void;
	setFilters: (filters: ReviewFilters) => void;
	setSorting: (sorting: ReviewSortingOrder) => void;
	setGrouping: (grouping: ReviewGrouping) => void;
	setPathnameToTitle: (map: Record<string, string>) => void;
	setSearchQuery: (query: string) => void;

	getCurrentItem: () => ReviewListItem;
	getNextItem: () => ReviewListItem;
	getPrevItem: () => ReviewListItem;
}

const store = create<ReviewStore>()(
	persist(
		(set, get) => ({
			catalogItems: null,
			articleItems: null,
			currentItem: null,
			currentScope: "article",
			sorting: "none",
			grouping: "none",
			pendingItem: null,
			filters: {},
			pathnameToTitle: {},
			searchQuery: "",

			setCatalogItems: (items) => set({ catalogItems: items }),
			setArticleItems: (items) => set({ articleItems: items }),
			setCurrentItem: (item) => set({ currentItem: item }),
			setCurrentScope: (scope) => set({ currentScope: scope }),
			setPendingItem: (item) => set({ pendingItem: item }),
			setFilters: (filters) => set({ filters }),
			setSorting: (sorting) => set({ sorting }),
			setGrouping: (grouping) => set({ grouping }),
			setPathnameToTitle: (map) => set({ pathnameToTitle: map }),
			setSearchQuery: (searchQuery) => set({ searchQuery }),

			getCurrentItem: () => get().currentItem,
			getNextItem: () => {
				const { currentItem, currentScope, catalogItems, articleItems } = get();
				const items = currentScope === "catalog" ? catalogItems : articleItems;
				if (!items || !currentItem) return;
				const idx = items.findIndex((i) => i.id === currentItem.id);
				return idx >= 0 && idx < items.length - 1 ? items[idx + 1] : null;
			},
			getPrevItem: () => {
				const { currentItem, currentScope, catalogItems, articleItems } = get();
				const items = currentScope === "catalog" ? catalogItems : articleItems;
				if (!items || !currentItem) return;
				const idx = items.findIndex((i) => i.id === currentItem.id);
				return idx > 0 ? items[idx - 1] : null;
			},
		}),
		{
			name: STORE_NAME,
			version: STORE_VERSION,
			partialize: (state) => ({ currentScope: state.currentScope }),
			storage: createJSONStorage(() => localStorage),
		},
	),
);

export const useReviewStore = <T>(selector: (state: ReviewStore) => T): T => {
	return useStoreWithEqualityFn(store, selector, shallow);
};

export const clearReviewStore = () => {
	store.setState({ catalogItems: null, articleItems: null, pathnameToTitle: {} });
};

export const updatePathnameToTitle = (map: Record<string, string>) => {
	const current = store.getState().pathnameToTitle;
	const newEntries = Object.fromEntries(Object.entries(map).filter(([key]) => !(key in current)));
	if (!Object.keys(newEntries).length) return;
	store.getState().setPathnameToTitle({ ...current, ...newEntries });
};

export const addReviewItem = (item: ReviewListItem) => {
	const { articleItems, catalogItems, setArticleItems, setCatalogItems } = store.getState();

	if (articleItems) setArticleItems([...articleItems.filter((i) => i.id !== item.id), item]);
	if (catalogItems) setCatalogItems([...catalogItems.filter((i) => i.id !== item.id), item]);
};

export const deleteReviewItem = (id: string) => {
	const { articleItems, catalogItems, setArticleItems, setCatalogItems } = store.getState();
	if (articleItems) setArticleItems(articleItems.filter((i) => i.id !== id));
	if (catalogItems) setCatalogItems(catalogItems.filter((i) => i.id !== id));
};
