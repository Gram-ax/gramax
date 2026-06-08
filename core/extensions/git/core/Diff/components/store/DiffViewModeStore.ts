import type SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import type { DiffViewMode } from "@ext/git/core/Diff/logic/model/DiffView";
import { create } from "zustand";

interface DiffViewModeState {
	sideBarData: SideBarData;
	diffEnabled: boolean;
	diffViewMode: DiffViewMode;
	disabledViewModes: DiffViewMode[];
	sourceTextLocked: boolean;
	doublePanelLocked: boolean;
	updateDiffEnabled: (enabled: boolean) => void;
	updateDiffViewMode: (mode: DiffViewMode) => void;
	updateDisabledViewModes: (modes: DiffViewMode[]) => void;
	updateSourceTextLocked: (locked: boolean) => void;
	updateDoublePanelLocked: (locked: boolean) => void;
	updateSideBarData: (sideBarData: SideBarData) => void;
}

const useDiffViewModeStore = create<DiffViewModeState>((set) => ({
	sideBarData: null,
	diffEnabled: false,
	diffViewMode: "wysiwyg-single",
	disabledViewModes: [],
	sourceTextLocked: false,
	doublePanelLocked: false,
	updateDiffEnabled: (enabled: boolean) => set({ diffEnabled: enabled }),
	updateDiffViewMode: (mode: DiffViewMode) => set({ diffViewMode: mode }),
	updateDisabledViewModes: (modes: DiffViewMode[]) => set({ disabledViewModes: modes }),
	updateSourceTextLocked: (locked: boolean) => set({ sourceTextLocked: locked }),
	updateDoublePanelLocked: (locked: boolean) => set({ doublePanelLocked: locked }),
	updateSideBarData: (sideBarData: SideBarData) => set({ sideBarData: sideBarData }),
}));

export const useSideBarData = () => useDiffViewModeStore((state) => state.sideBarData);

export const setSideBarData = (sideBarData: SideBarData) => {
	useDiffViewModeStore.getState().updateSideBarData(sideBarData);
};

export const useDiffEnabled = () => useDiffViewModeStore((state) => state.diffEnabled);

export const useDiffViewMode = () => useDiffViewModeStore((state) => state.diffViewMode);

export const useSourceTextLocked = () => useDiffViewModeStore((state) => state.sourceTextLocked);

export const useDisabledViewModes = () => useDiffViewModeStore((state) => state.disabledViewModes);

export const setDiffEnabled = (enabled: boolean) => {
	useDiffViewModeStore.getState().updateDiffEnabled(enabled);
};

export const getDiffViewMode = (): DiffViewMode => useDiffViewModeStore.getState().diffViewMode;

export const updateDiffViewMode = (mode: DiffViewMode) => {
	useDiffViewModeStore.getState().updateDiffViewMode(mode);
};

export const updateDisabledViewModes = (modes: DiffViewMode[]) => {
	useDiffViewModeStore.getState().updateDisabledViewModes(modes);
};

export const setSourceTextLocked = (locked: boolean) => {
	useDiffViewModeStore.getState().updateSourceTextLocked(locked);
};

export const useDoublePanelLocked = () => useDiffViewModeStore((state) => state.doublePanelLocked);

export const setDoublePanelLocked = (locked: boolean) => {
	useDiffViewModeStore.getState().updateDoublePanelLocked(locked);
};
