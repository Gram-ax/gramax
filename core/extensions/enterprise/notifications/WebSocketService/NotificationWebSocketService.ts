import { span } from "@ext/loggers/opentelemetry";
import { WebSocketClient, WebSocketMessageType } from "./WebSocketService";

enum NotificationMessageType {
	ArticleNotification = "articleNotification",
}

type AnyMessageType = WebSocketMessageType | NotificationMessageType;

export interface NotificationMessage {
	type: NotificationMessageType.ArticleNotification;
	id: string;
	notificationId: number;
	articleTitle: string;
	articlePath: string;
	catalogName: string;
	previewText?: string;
	action: "created" | "updated";
	timestamp: number;
	author?: string;
}

interface WebSocketMessage {
	type: AnyMessageType;
	[key: string]: unknown;
}

type MessageHandler = (data: WebSocketMessage) => void;

export class NotificationWebSocketService extends WebSocketClient<WebSocketMessage> {
	private _token: string | null = null;

	private readonly _messageHandlers: Record<AnyMessageType, MessageHandler> = {
		[WebSocketMessageType.ConnectionEstablished]: () => {
			span()?.addEvent("connectionEstablished");
			this.emit("connect", {});
		},
		[NotificationMessageType.ArticleNotification]: (data) => {
			span()?.addEvent("notificationReceived", {
				notificationId: String(data.notificationId ?? ""),
				articleTitle: String(data.articleTitle ?? ""),
			});
			this.emit("notification", data);
		},
	};

	connect(gesUrl: string, token: string): void {
		this._token = token;

		const wsUrl = gesUrl.replace(/^http/, "ws");
		const url = `${wsUrl}/ws/notifications`;

		this.connectToUrl(url);
	}

	protected onConnected(): void {
		this.sendRaw({ type: "auth", token: this._token });
	}

	protected handleMessage(data: WebSocketMessage): void {
		this._messageHandlers[data.type]?.(data);
	}
}

export const notificationWebSocketService = new NotificationWebSocketService();
