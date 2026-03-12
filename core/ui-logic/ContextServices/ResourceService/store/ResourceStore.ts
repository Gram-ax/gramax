import type { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import { create } from "zustand";

export type ResourceData = Record<string, Buffer>;

export interface ResourceStoreState {
	data: ResourceData;
	id?: string;
	provider?: ArticleProviderType;
	update: (src: string, buffer: Buffer) => void;
	get: (src: string) => Buffer | undefined;
	clear: () => void;
	remove: (src: string) => void;
	reset: (newId?: string, newProvider?: ArticleProviderType) => void;
}

interface ResourceStoreProps {
	id?: string;
	provider?: ArticleProviderType;
}

export const createResourceStore = ({ id, provider }: ResourceStoreProps) =>
	create<ResourceStoreState>((set, get) => ({
		id,
		provider,

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

		reset: (newId?: string, newProvider?: ArticleProviderType) => {
			set({ data: {}, id: newId, provider: newProvider });
		},
	}));
