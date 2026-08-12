import type { ArticleDiffData } from "@core/SitePresenter/types/ArticlePage";
import { createStore } from "zustand/vanilla";

export type DiffStore = {
	diff: ArticleDiffData;
	setDiff: (diff: ArticleDiffData) => void;
};

export const createDiffStore = (initState: { diff: ArticleDiffData } = { diff: undefined }) => {
	return createStore<DiffStore>()((set) => ({
		...initState,
		setDiff: (diff) => set({ diff }),
	}));
};
