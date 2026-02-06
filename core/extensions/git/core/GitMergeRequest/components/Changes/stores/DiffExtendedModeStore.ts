import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DiffDisplaySettingsState {
	extendedMode: boolean;
	setDiffExtendedMode: (state: boolean) => void;
}

export const useDiffDisplaySettingsStore = create<DiffDisplaySettingsState>()(
	persist(
		(set) => ({
			extendedMode: false,
			setDiffExtendedMode: (state: boolean) =>
				set(() => {
					return { extendedMode: state };
				}),
		}),
		{
			name: "diff-extended-display",
		},
	),
);

export const useDiffExtendedMode = () => useDiffDisplaySettingsStore((state) => state.extendedMode);
export const useSetDiffExtendedMode = () => useDiffDisplaySettingsStore((state) => state.setDiffExtendedMode);
