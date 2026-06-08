import { useEffect } from "react";
import { create } from "zustand";

interface ModalBlockerStore {
	blockers: Set<string>;
	register: (id: string) => void;
	unregister: (id: string) => void;
	isBlocked: () => boolean;
}

export const useModalBlockerStore = create<ModalBlockerStore>((set, get) => ({
	blockers: new Set(),

	register: (id) =>
		set((state) => ({
			blockers: new Set(state.blockers).add(id),
		})),

	unregister: (id) =>
		set((state) => {
			const next = new Set(state.blockers);
			next.delete(id);
			return { blockers: next };
		}),

	isBlocked: () => get().blockers.size > 0,
}));

export const useModalBlocker = (id: string, isActive: boolean): void => {
	useEffect(() => {
		if (!isActive) return;
		useModalBlockerStore.getState().register(id);
		return () => useModalBlockerStore.getState().unregister(id);
	}, [id, isActive]);
};
