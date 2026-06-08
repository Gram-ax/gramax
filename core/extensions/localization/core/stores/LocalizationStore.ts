import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocalizationStore {
	showPreviewArticle: boolean;
	setShowPreviewArticle: (showPreviewArticle: boolean) => void;
}

const useLocalizationStore = create<LocalizationStore>()(
	persist(
		(set) => ({
			showPreviewArticle: true,
			setShowPreviewArticle: (showPreviewArticle) => set({ showPreviewArticle }),
		}),
		{ name: "localization-state", partialize: (s) => ({ showPreviewArticle: s.showPreviewArticle }) },
	),
);

export const useShowPreviewArticle = () => useLocalizationStore((state) => state.showPreviewArticle);

export const useSetShowPreviewArticle = () => useLocalizationStore((state) => state.setShowPreviewArticle);
