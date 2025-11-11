import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { createStore } from "zustand/vanilla";

export type CatalogPropsStore = {
	data: ClientCatalogProps;
	update: (patch: Partial<ClientCatalogProps>) => void;
};

export const defaultInitState = {
	data: {} as ClientCatalogProps,
};

export const createCatalogPropsStore = (initState = defaultInitState) => {
	return createStore<CatalogPropsStore>()((set) => ({
		...initState,
		update: (patch: Partial<ClientCatalogProps>) => set((state) => ({ data: { ...state.data, ...patch } })),
	}));
};
