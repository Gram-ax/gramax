import { type IconCode, LucideIcon } from "@components/Atoms/Icon/LucideIcon";
import { useCallback, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

export type IconCategory = {
	[icon: string]: string[];
};

export interface IconDataStore {
	categories: IconCategory;
	lastUsedIcons: string[];
	setCategories: (categories: IconCategory) => void;
	setLastUsedIcons: (lastUsedIcons: string[]) => void;
}

const STORE_VERSION = 1;
const STORE_NAME = "last-used-icons";
const MAX_LAST_USED_ICONS = 28;

const store = create<IconDataStore>()(
	persist(
		(set) => ({
			categories: {},
			lastUsedIcons: [],
			setCategories: (categories) => set({ categories }),
			setLastUsedIcons: (lastUsedIcons) => set({ lastUsedIcons }),
		}),
		{
			name: STORE_NAME,
			version: STORE_VERSION,
			partialize: (state) => ({ lastUsedIcons: state.lastUsedIcons }),
		},
	),
);

export const updateLastUsedIcons = (icon: string) => {
	store.setState((state) => ({
		lastUsedIcons: [...state.lastUsedIcons.filter((i) => i !== icon), icon].slice(-MAX_LAST_USED_ICONS),
	}));
};

export const useIconDataStore = <T>(selector: (state: IconDataStore) => T): T => {
	return useStoreWithEqualityFn(store, selector, shallow);
};

export const useIconCategories = (shouldFetch: boolean = true) => {
	const { categories, setCategories } = useIconDataStore((state) => ({
		categories: state.categories,
		setCategories: state.setCategories,
	}));

	const getCategories = useCallback(async () => {
		try {
			const response = await fetch("https://lucide.dev/api/categories", {
				method: "GET",
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = (await response.json()) as IconCategory;
			const entries = Object.entries(data);
			const resolved = await entries.mapAsync(([icon]) => LucideIcon(icon as IconCode));
			const icons: IconCategory = Object.fromEntries(entries.filter((_, i) => resolved[i]));
			setCategories(icons);
		} catch (error) {
			console.error("Error fetching categories:", error);
		}
	}, [setCategories]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (!shouldFetch || Object.keys(categories).length > 0) return;
		void getCategories();
	}, [shouldFetch]);

	return categories;
};
