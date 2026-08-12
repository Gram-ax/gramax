import { addEvent, Level } from "@ext/loggers/opentelemetry";
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
			addEvent("connectionEstablished", Level.Important);
			this._emit("connect", {});
		},
		[NotificationMessageType.ArticleNotification]: (data) => {
			addEvent("notificationReceived", Level.Internal, {
				notificationId: String(data.notificationId ?? ""),
				articleTitle: String(data.articleTitle ?? ""),
			});
			this._emit("notification", data);
		},
	};

	connect(gesUrl: string, token: string): void {
		this._token = token;

		const wsUrl = gesUrl.replace(/^http/, "ws");
		const url = `${wsUrl}/enterprise/ws/notifications`;

		this._connectToUrl(url);
	}

	protected _onConnected(): void {
		this._sendRaw({ type: "auth", token: this._token });
	}

	protected _handleMessage(data: WebSocketMessage): void {
		this._messageHandlers[data.type]?.(data);
	}
}

export const notificationWebSocketService = new NotificationWebSocketService();
