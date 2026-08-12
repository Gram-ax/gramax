import { emojis } from "@ext/markdown/elements/icon/edit/data/buildEmojiData";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

const STORE_NAME = "last-used-emojis";
const STORE_VERSION = 1;
const MAX_LAST_USED_EMOJIS = 28;

interface EmojiDataStore {
	lastUsedEmojis: string[];
	setLastUsedEmojis: (emojis: string[]) => void;
}

const store = create<EmojiDataStore>()(
	persist(
		(set) => ({
			lastUsedEmojis: [],
			setLastUsedEmojis: (emojis) => set({ lastUsedEmojis: emojis }),
		}),
		{
			name: STORE_NAME,
			version: STORE_VERSION,
			partialize: (state) => ({ lastUsedEmojis: state.lastUsedEmojis }),
		},
	),
);

export const updateLastUsedEmojis = (emoji: string) => {
	return store.setState((state) => ({
		lastUsedEmojis: [...state.lastUsedEmojis.filter((e) => e !== emoji), emoji].slice(-MAX_LAST_USED_EMOJIS),
	}));
};

const useEmojiDataStore = <T>(selector: (state: EmojiDataStore) => T): T => {
	return useStoreWithEqualityFn(store, selector, shallow);
};

export const useLastUsedEmojis = () => useEmojiDataStore((state) => state.lastUsedEmojis);

export const useEmojiData = () => emojis;
