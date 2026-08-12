import type SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import { create } from "zustand";

interface DiffViewModeState {
	sideBarData: SideBarData;
	resourceDiffEnabled: boolean;
	isDoublePanel: boolean;
	disabledDoublePanel: boolean;
	sourceTextLocked: boolean;
	doublePanelLocked: boolean;
	updateResourceDiffEnabled: (enabled: boolean) => void;
	updateIsDoublePanel: (isDoublePanel: boolean) => void;
	updateDisabledDoublePanel: (disabled: boolean) => void;
	updateSourceTextLocked: (locked: boolean) => void;
	updateDoublePanelLocked: (locked: boolean) => void;
	updateSideBarData: (sideBarData: SideBarData) => void;
}

const useDiffViewModeStore = create<DiffViewModeState>()((set) => ({
	sideBarData: null,
	resourceDiffEnabled: false,
	isDoublePanel: false,
	disabledDoublePanel: false,
	sourceTextLocked: false,
	doublePanelLocked: false,
	updateResourceDiffEnabled: (enabled: boolean) => set({ resourceDiffEnabled: enabled }),
	updateIsDoublePanel: (isDoublePanel: boolean) => set({ isDoublePanel }),
	updateDisabledDoublePanel: (disabled: boolean) => set({ disabledDoublePanel: disabled }),
	updateSourceTextLocked: (locked: boolean) => set({ sourceTextLocked: locked }),
	updateDoublePanelLocked: (locked: boolean) => set({ doublePanelLocked: locked }),
	updateSideBarData: (sideBarData: SideBarData) => set({ sideBarData: sideBarData }),
}));

export const useSideBarData = () => useDiffViewModeStore((state) => state.sideBarData);

export const setSideBarData = (sideBarData: SideBarData) => {
	useDiffViewModeStore.getState().updateSideBarData(sideBarData);
};

export const useResourceDiffEnabled = () => useDiffViewModeStore((state) => state.resourceDiffEnabled);

export const setDiffEnabled = (enabled: boolean) => {
	useDiffViewModeStore.getState().updateResourceDiffEnabled(enabled);
};

export const useIsDoublePanel = () => useDiffViewModeStore((state) => state.isDoublePanel);

export const useDisabledDoublePanel = () => useDiffViewModeStore((state) => state.disabledDoublePanel);

export const useSourceTextLocked = () => useDiffViewModeStore((state) => state.sourceTextLocked);

export const setIsDoublePanel = (isDoublePanel: boolean) => {
	useDiffViewModeStore.getState().updateIsDoublePanel(isDoublePanel);
};

export const setDisabledDoublePanel = (disabled: boolean) => {
	useDiffViewModeStore.getState().updateDisabledDoublePanel(disabled);
};

export const setSourceTextLocked = (locked: boolean) => {
	useDiffViewModeStore.getState().updateSourceTextLocked(locked);
};

export const useDoublePanelLocked = () => useDiffViewModeStore((state) => state.doublePanelLocked);

export const setDoublePanelLocked = (locked: boolean) => {
	useDiffViewModeStore.getState().updateDoublePanelLocked(locked);
};
