import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import { createStore } from "zustand";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

interface MergeRequestStore {
	isDraft: boolean;
	mergeRequest: MergeRequest | null;
	setMergeRequest: (mergeRequest: MergeRequest) => void;
	setIsDraft: (isDraft: boolean) => void;
}

const mergeRequestStore = createStore<MergeRequestStore>((set) => ({
	isDraft: false,
	mergeRequest: null,
	setMergeRequest: (mergeRequest: MergeRequest) => {
		set({ mergeRequest });
	},
	setIsDraft: (isDraft: boolean) => {
		set({ isDraft });
	},
}));

export const useMergeRequestStore = <T>(selector: (store: MergeRequestStore) => T): T => {
	return useStoreWithEqualityFn(mergeRequestStore, selector, shallow);
};
