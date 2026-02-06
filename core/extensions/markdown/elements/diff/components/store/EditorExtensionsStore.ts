import { Extensions } from "@tiptap/react";

import { create } from "zustand";

interface EditorExtensionsState {
	extensions: Extensions;
	updateExtensions: (extensions: Extensions) => void;
}

const useEditorExtensionsStore = create<EditorExtensionsState>((set) => ({
	extensions: null,
	updateExtensions: (extensions: Extensions) => set({ extensions }),
}));

export const useEditorExtensions = () => useEditorExtensionsStore((state) => state.extensions);

export const updateEditorExtensions = (extensions: Extensions) => {
	useEditorExtensionsStore.getState().updateExtensions(extensions);
};
