import { create } from "zustand";

interface ScrollPositionMap {
	[articlePath: string]: number;
}

interface ScrollPositionStore {
	positions: ScrollPositionMap;
	setPosition: (articlePath: string, position: number) => void;
	getPosition: (articlePath: string) => number | undefined;
	clearPosition: (articlePath: string) => void;
	clearAll: () => void;
}

export const useScrollPositionStore = create<ScrollPositionStore>((set, get) => ({
	positions: {},

	setPosition: (articlePath: string, position: number) => {
		set((state) => ({
			positions: { ...state.positions, [articlePath]: position },
		}));
	},

	getPosition: (articlePath: string) => {
		return get().positions[articlePath];
	},

	clearPosition: (articlePath: string) => {
		set((state) => {
			const { [articlePath]: _, ...rest } = state.positions;
			return { positions: rest };
		});
	},

	clearAll: () => {
		set({ positions: {} });
	},
}));
