import { create } from "zustand";

interface CardStore {
	isLoading: Record<string, boolean>;
	setLoading: (catalogName: string, loading: boolean) => void;
	clearLoading: (catalogName: string) => void;
}

const useCardStore = create<CardStore>((set) => ({
	isLoading: {},
	setLoading: (catalogName, loading) =>
		set((state) => ({
			isLoading: { ...state.isLoading, [catalogName]: loading },
		})),
	clearLoading: (catalogName) =>
		set((state) => {
			const newLoading = { ...state.isLoading };
			delete newLoading[catalogName];
			return { isLoading: newLoading };
		}),
}));

export const useCardLoading = (catalogName: string) => useCardStore((state) => state.isLoading[catalogName] ?? false);

export const setCardLoading = (catalogName: string, loading: boolean) =>
	useCardStore.getState().setLoading(catalogName, loading);

export const clearCardLoading = (catalogName: string) => useCardStore.getState().clearLoading(catalogName);
