import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

type ReviewNotification = {
	id: string;
	viewedAt: string;
};

interface ReviewNotificationsStore {
	notifications: ReviewNotification[];
	setNotifications: (notifications: ReviewNotification[]) => void;
	readItem: (id: string) => void;
}

const STORE_VERSION = 1;

const STORE_NAME = "review-notifications-state";

const reviewNotificationsStore = create<ReviewNotificationsStore>()(
	persist(
		(set) => ({
			notifications: [],
			setNotifications: (notifications) => set({ notifications }),
			readItem: (id) =>
				set((state) => {
					if (state.notifications.find((n) => n.id === id)) return state;
					const notifications = [...(state.notifications ?? []), { id, viewedAt: new Date().toISOString() }];
					return { notifications };
				}),
		}),
		{
			name: STORE_NAME,
			version: STORE_VERSION,
			partialize: (state) => ({ notifications: state.notifications }),
			storage: createJSONStorage(() => localStorage),
		},
	),
);

export const useReviewNotificationsStore = <T>(selector: (state: ReviewNotificationsStore) => T): T => {
	return useStoreWithEqualityFn(reviewNotificationsStore, selector, shallow);
};

export const markItemAsRead = (id: string) => {
	reviewNotificationsStore.getState().readItem(id);
};
