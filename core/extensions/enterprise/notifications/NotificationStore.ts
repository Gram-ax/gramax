import type {
	NotificationMessage,
	NotificationWebSocketService,
} from "@ext/enterprise/notifications/WebSocketService/NotificationWebSocketService";
import { create } from "zustand";

export interface UserNotification {
	id: number;
	article_title: string;
	article_url: string;
	catalog_name: string;
	preview_text?: string;
	created_at: string;
	is_read: boolean;
}

interface NotificationStore {
	notifications: UserNotification[];
	unreadCount: number;
	webSocketService: NotificationWebSocketService | null;

	setNotifications: (notifications: UserNotification[]) => void;
	addNotification: (notification: NotificationMessage) => void;
	removeNotification: (notificationId: number) => void;
	markAsRead: (notificationId: number) => void;
	setWebSocketService: (service: NotificationWebSocketService) => void;
	reset: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
	notifications: [],
	unreadCount: 0,
	webSocketService: null,

	setNotifications: (notifications) =>
		set({ notifications, unreadCount: notifications.filter((n) => !n.is_read).length }),

	addNotification: (wsNotification) =>
		set((state) => {
			const newNotification: UserNotification = {
				id: wsNotification.notificationId,
				article_title: wsNotification.articleTitle,
				article_url: wsNotification.articlePath,
				catalog_name: wsNotification.catalogName,
				preview_text: wsNotification.previewText,
				created_at: new Date(wsNotification.timestamp).toISOString(),
				is_read: false,
			};

			const exists = state.notifications.some((n) => n.id === newNotification.id);
			if (exists) return state;

			const notifications = [newNotification, ...state.notifications];
			return {
				notifications,
				unreadCount: state.unreadCount + 1,
			};
		}),

	removeNotification: (notificationId) =>
		set((state) => {
			const removed = state.notifications.find((n) => n.id === notificationId);
			const notifications = state.notifications.filter((n) => n.id !== notificationId);
			return {
				notifications,
				unreadCount: removed && !removed.is_read ? state.unreadCount - 1 : state.unreadCount,
			};
		}),

	markAsRead: (notificationId) =>
		set((state) => {
			const notification = state.notifications.find((n) => n.id === notificationId);
			if (!notification || notification.is_read) return state;

			const notifications = state.notifications.map((n) =>
				n.id === notificationId ? { ...n, is_read: true } : n,
			);
			return {
				notifications,
				unreadCount: state.unreadCount - 1,
			};
		}),

	setWebSocketService: (service) => set({ webSocketService: service }),

	reset: () => set({ notifications: [], unreadCount: 0 }),
}));

// Selectors for easy access
export const useUnreadCount = () => useNotificationStore((state) => state.unreadCount);
export const useNotifications = () => useNotificationStore((state) => state.notifications);
export const useWebSocketService = () => useNotificationStore((state) => state.webSocketService);

// Actions that can be called outside of React components
export const addNotification = (notification: NotificationMessage) =>
	useNotificationStore.getState().addNotification(notification);

export const markNotificationAsRead = (notificationId: number) =>
	useNotificationStore.getState().markAsRead(notificationId);

export const setNotifications = (notifications: UserNotification[]) =>
	useNotificationStore.getState().setNotifications(notifications);
