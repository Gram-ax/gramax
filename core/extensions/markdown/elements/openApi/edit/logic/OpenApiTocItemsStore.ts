import type { OpenApiNavigation } from "@ext/markdown/elements/openApi/edit/logic/buildNavigationFromSpec";
import { createStore } from "zustand/vanilla";

export type OpenApiTocItemsStore = {
	data: Record<string, OpenApiNavigation[]>;
	setTocItemsData: (key: string, value: OpenApiNavigation[]) => void;
};

export const createOpenApiTocItemsStore = () => {
	return createStore<OpenApiTocItemsStore>((set) => ({
		data: {},

		setTocItemsData: (key, value) =>
			set((state) => {
				return {
					data: {
						...state.data,
						[key]: value,
					},
				};
			}),
	}));
};
