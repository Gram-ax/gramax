import { create } from "zustand";

interface ScrollPositionMap {
	[articlePath: string]: number;
}

interface ScrollPositionStore {
	positions: ScrollPositionMap;
	isProgrammaticScroll: boolean;
	isRestoringScrollPosition: boolean;
	setPosition: (articlePath: string, position: number) => void;
	getPosition: (articlePath: string) => number | undefined;
	clearPosition: (articlePath: string) => void;
	clearAll: () => void;
	setProgrammaticScroll: (value: boolean) => void;
	setRestoringScrollPosition: (value: boolean) => void;
}

export const useScrollPositionStore = create<ScrollPositionStore>((set, get) => ({
	positions: {},
	isProgrammaticScroll: false,
	isRestoringScrollPosition: false,

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

	setProgrammaticScroll: (value: boolean) => {
		set({ isProgrammaticScroll: value });
	},

	setRestoringScrollPosition: (value: boolean) => {
		set({ isRestoringScrollPosition: value });
	},
}));
