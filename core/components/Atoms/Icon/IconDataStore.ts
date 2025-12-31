import { useCallback, useEffect } from "react";
import { create } from "zustand";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

export interface IconDataStore {
	categories: Record<string, string[]>;
	setCategories: (categories: Record<string, string[]>) => void;
}

const store = create<IconDataStore>((set) => ({
	categories: {},
	setCategories: (categories) => set({ categories }),
}));

export const useIconCategories = () => {
	const { categories, setCategories } = useStoreWithEqualityFn(
		store,
		(state) => {
			return {
				categories: state.categories,
				setCategories: state.setCategories,
			};
		},
		shallow,
	);

	const getCategories = useCallback(async () => {
		try {
			const response = await fetch("https://lucide.dev/api/categories", {
				method: "GET",
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			setCategories(data);
		} catch (error) {
			console.error("Error fetching categories:", error);
		}
	}, []);

	useEffect(() => {
		if (Object.keys(categories).length > 0) return;
		void getCategories();
	}, [categories]);

	return categories;
};
