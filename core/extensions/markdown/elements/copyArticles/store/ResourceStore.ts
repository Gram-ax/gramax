import { create } from "zustand";

type ResourceData = Record<string, Buffer>;

interface ResourceStoreState {
	data: ResourceData;
	update: (src: string, buffer: Buffer) => void;
	get: (src: string) => Buffer | undefined;
	clear: () => void;
	remove: (src: string) => void;
}

export const useResourceStore = create<ResourceStoreState>((set, get) => ({
	data: {},

	update: (src: string, buffer: Buffer) => {
		set((state) => ({
			data: { ...state.data, [src]: buffer },
		}));
	},

	get: (src: string) => {
		return get().data[src];
	},

	clear: () => {
		set({ data: {} });
	},

	remove: (src: string) => {
		set((state) => {
			const { [src]: _, ...rest } = state.data;
			return { data: rest };
		});
	},
}));

export const getResourceFromStore = (src: string): Buffer | undefined => {
	return useResourceStore.getState().get(src);
};

export const updateResourceInStore = (src: string, buffer: Buffer): void => {
	useResourceStore.getState().update(src, buffer);
};

export const clearResourceStore = (): void => {
	useResourceStore.getState().clear();
};
