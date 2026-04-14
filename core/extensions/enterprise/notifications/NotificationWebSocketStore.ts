import type { NotificationMessage } from "@ext/enterprise/notifications/WebSocketService/NotificationWebSocketService";
import { notificationWebSocketService } from "@ext/enterprise/notifications/WebSocketService/NotificationWebSocketService";
import { create } from "zustand";

interface NotificationWebSocketStore {
	connectionState: number | null;
	userEmail: string | null;
	gesUrl: string | null;

	connect: (userEmail: string, gesUrl: string, token: string) => void;
	disconnect: () => void;
	onNotification: (callback: (notification: NotificationMessage) => void) => () => void;
}

export const useNotificationWebSocketStore = create<NotificationWebSocketStore>((set) => {
	const handleConnect = () => {
		set({ connectionState: WebSocket.OPEN });
	};

	const handleDisconnect = () => {
		set({ connectionState: WebSocket.CLOSED });
	};

	if (typeof window !== "undefined") {
		notificationWebSocketService.on("connect", handleConnect);
		notificationWebSocketService.on("disconnect", handleDisconnect);
	}

	return {
		connectionState: notificationWebSocketService.getState(),
		userEmail: null,
		gesUrl: null,

		connect: (userEmail, gesUrl, token) => {
			set({ userEmail, gesUrl });
			notificationWebSocketService.connect(gesUrl, token);
		},

		disconnect: () => {
			notificationWebSocketService.disconnect();
			set({ userEmail: null, gesUrl: null });
		},

		onNotification: (callback) => {
			notificationWebSocketService.on("notification", callback);
			return () => {
				notificationWebSocketService.off("notification", callback);
			};
		},
	};
});

// Selectors
export const useNotificationWebSocketConnection = () =>
	useNotificationWebSocketStore((state) => state.connectionState === WebSocket.OPEN);
export const useNotificationWebSocketState = () => useNotificationWebSocketStore((state) => state.connectionState);
