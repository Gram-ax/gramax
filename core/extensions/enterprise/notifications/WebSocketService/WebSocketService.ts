import { addEvent, Level, trace } from "@ext/loggers/opentelemetry";

export enum WebSocketMessageType {
	ConnectionEstablished = "connectionEstablished",
}

type EventListener = (data: unknown) => void;

export class WebSocketClient<TMessage = unknown> {
	protected _ws: WebSocket | null = null;
	private _reconnectTimeout: NodeJS.Timeout | null = null;
	private _reconnectAttempts = 0;
	private _maxReconnectAttempts = 10;
	private _baseReconnectDelay = 1000;
	private _maxReconnectDelay = 30000;
	private _shouldReconnect = true;
	private _listeners = new Map<string, Set<EventListener>>();
	protected _url: string | null = null;

	@trace({ level: Level.Internal })
	protected _connectToUrl(url: string): void {
		this._url = url;
		this._shouldReconnect = true;
		this._reconnectAttempts = 0;
		this._connect();
	}

	private _connect(): void {
		if (!this._url) {
			addEvent("connectionFailed", Level.Commands, { reason: "missingUrl" });
			return;
		}

		if (
			this._ws?.readyState === WebSocket.OPEN ||
			this._ws?.readyState === WebSocket.CONNECTING ||
			this._ws?.readyState === WebSocket.CLOSING
		) {
			return;
		}

		try {
			addEvent("connecting", Level.Internal, { url: this._url });
			this._ws = new WebSocket(this._url);

			this._ws.onopen = () => {
				addEvent("connected", Level.Important);
				this._reconnectAttempts = 0;
				this._onConnected();
			};

			this._ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data) as TMessage;
					this._handleMessage(data);
				} catch (error) {
					addEvent("messageParseError", Level.Commands, { error: String(error) });
				}
			};

			this._ws.onerror = (error) => {
				addEvent("websocketError", Level.Commands, { error: String(error) });
				this._emit("error", error);
			};

			this._ws.onclose = (event) => {
				addEvent("connectionClosed", Level.Important, { code: event.code });
				this._ws = null;
				this._emit("disconnect", { code: event.code });

				if (this._shouldReconnect && this._reconnectAttempts < this._maxReconnectAttempts) {
					this._scheduleReconnect();
				} else if (this._reconnectAttempts >= this._maxReconnectAttempts) {
					addEvent("maxReconnectAttempts", Level.Commands, { attempts: this._maxReconnectAttempts });
					this._emit("maxReconnectAttempts", {});
				}
			};
		} catch (error) {
			addEvent("connectionError", Level.Commands, { error: String(error) });
			this._emit("error", error);
			this._scheduleReconnect();
		}
	}

	protected _handleMessage(data: TMessage): void {
		this._emit("message", data);
	}

	protected _onConnected(): void {
		this._emit("connect", {});
	}

	private _scheduleReconnect(): void {
		if (!this._shouldReconnect) return;

		this._reconnectAttempts++;
		const delay = Math.min(this._baseReconnectDelay * 2 ** (this._reconnectAttempts - 1), this._maxReconnectDelay);

		addEvent("reconnectScheduled", Level.Internal, {
			delay,
			attempt: this._reconnectAttempts,
			maxAttempts: this._maxReconnectAttempts,
		});

		this._reconnectTimeout = setTimeout(() => {
			this._connect();
		}, delay);
	}

	disconnect(): void {
		this._shouldReconnect = false;

		if (this._reconnectTimeout) {
			clearTimeout(this._reconnectTimeout);
			this._reconnectTimeout = null;
		}

		if (this._ws) {
			this._ws.close();
			this._ws = null;
		}

		addEvent("disconnected", Level.Important);
	}

	on(event: string, listener: EventListener): void {
		if (!this._listeners.has(event)) {
			this._listeners.set(event, new Set());
		}
		this._listeners.get(event)!.add(listener);
	}

	off(event: string, listener: EventListener): void {
		const eventListeners = this._listeners.get(event);
		if (eventListeners) {
			eventListeners.delete(listener);
		}
	}

	protected _emit(event: string, data: unknown): void {
		const eventListeners = this._listeners.get(event);
		if (eventListeners) {
			for (const listener of eventListeners) {
				try {
					listener(data);
				} catch (error) {
					addEvent("listenerError", Level.Commands, { event, error: String(error) });
				}
			}
		}
	}

	protected _sendRaw(data: unknown): void {
		if (this._ws?.readyState === WebSocket.OPEN) {
			this._ws.send(JSON.stringify(data));
		}
	}

	isConnected(): boolean {
		return this._ws?.readyState === WebSocket.OPEN;
	}

	getState(): number | null {
		return this._ws?.readyState ?? null;
	}
}
