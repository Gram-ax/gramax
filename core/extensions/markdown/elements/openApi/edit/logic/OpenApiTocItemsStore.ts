import OPEN_API_NAME from "@ext/markdown/elements/openApi/name";
import type { TocItem } from "@ext/navigation/article/logic/createTocItems";
import type { Node } from "prosemirror-model";
import { createStore } from "zustand/vanilla";

export type OpenApiTocItemsStore = {
	data: Record<string, TocItem[]>;
	setTocItemsData: (key: string, value: TocItem[]) => void;
};

export const createOpenApiTocItemsResolver = (data: Record<string, TocItem[]>) => (node: Node) =>
	node.type.name === OPEN_API_NAME ? data[node.attrs.src] : undefined;

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
