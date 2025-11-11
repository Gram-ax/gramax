import { DiffViewMode } from "@ext/markdown/elements/diff/components/DiffBottomBar";
import { create } from "zustand";

interface DiffViewModeState {
	diffViewMode: DiffViewMode;
	updateDiffViewMode: (mode: DiffViewMode) => void;
}

const useDiffViewModeStore = create<DiffViewModeState>((set) => ({
	diffViewMode: "wysiwyg-single",
	updateDiffViewMode: (mode: DiffViewMode) => set({ diffViewMode: mode }),
}));

export const useDiffViewMode = () => useDiffViewModeStore((state) => state.diffViewMode);

export const updateDiffViewMode = (mode: DiffViewMode) => {
	useDiffViewModeStore.getState().updateDiffViewMode(mode);
};
