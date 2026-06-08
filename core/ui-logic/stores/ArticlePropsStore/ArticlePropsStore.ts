import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { createStore } from "zustand/vanilla";

export type ArticlePropsStore = {
	data: ClientArticleProps;
	update: (patch: Partial<ClientArticleProps>) => void;
};

const defaultInitState = {
	data: {} as ClientArticleProps,
};

export const createArticlePropsStore = (initState = defaultInitState) => {
	return createStore<ArticlePropsStore>()((set) => ({
		...initState,
		update: (patch: Partial<ClientArticleProps>) => set((state) => ({ data: { ...state.data, ...patch } })),
	}));
};
