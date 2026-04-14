import { span, trace } from "@ext/loggers/opentelemetry";

export enum WebSocketMessageType {
	ConnectionEstablished = "connectionEstablished",
}

type EventListener = (data: unknown) => void;

export class WebSocketClient<TMessage = unknown> {
	protected ws: WebSocket | null = null;
	private _reconnectTimeout: NodeJS.Timeout | null = null;
	private _reconnectAttempts = 0;
	private _maxReconnectAttempts = 10;
	private _baseReconnectDelay = 1000;
	private _maxReconnectDelay = 30000;
	private _shouldReconnect = true;
	private _listeners = new Map<string, Set<EventListener>>();
	protected url: string | null = null;

	@trace()
	protected connectToUrl(url: string): void {
		this.url = url;
		this._shouldReconnect = true;
		this._reconnectAttempts = 0;
		this._connect();
	}

	private _connect(): void {
		if (!this.url) {
			span()?.addEvent("connectionFailed", { reason: "missingUrl" });
			return;
		}

		if (
			this.ws?.readyState === WebSocket.OPEN ||
			this.ws?.readyState === WebSocket.CONNECTING ||
			this.ws?.readyState === WebSocket.CLOSING
		) {
			return;
		}

		try {
			span()?.addEvent("connecting", { url: this.url });
			this.ws = new WebSocket(this.url);

			this.ws.onopen = () => {
				span()?.addEvent("connected");
				this._reconnectAttempts = 0;
				this.onConnected();
			};

			this.ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data) as TMessage;
					this.handleMessage(data);
				} catch (error) {
					span()?.addEvent("messageParseError", { error: String(error) });
				}
			};

			this.ws.onerror = (error) => {
				span()?.addEvent("websocketError", { error: String(error) });
				this.emit("error", error);
			};

			this.ws.onclose = (event) => {
				span()?.addEvent("connectionClosed", { code: event.code });
				this.ws = null;
				this.emit("disconnect", { code: event.code });

				if (this._shouldReconnect && this._reconnectAttempts < this._maxReconnectAttempts) {
					this._scheduleReconnect();
				} else if (this._reconnectAttempts >= this._maxReconnectAttempts) {
					span()?.addEvent("maxReconnectAttempts", { attempts: this._maxReconnectAttempts });
					this.emit("maxReconnectAttempts", {});
				}
			};
		} catch (error) {
			span()?.addEvent("connectionError", { error: String(error) });
			this.emit("error", error);
			this._scheduleReconnect();
		}
	}

	protected handleMessage(data: TMessage): void {
		this.emit("message", data);
	}

	protected onConnected(): void {
		this.emit("connect", {});
	}

	private _scheduleReconnect(): void {
		if (!this._shouldReconnect) return;

		this._reconnectAttempts++;
		const delay = Math.min(this._baseReconnectDelay * 2 ** (this._reconnectAttempts - 1), this._maxReconnectDelay);

		span()?.addEvent("reconnectScheduled", {
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

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		span()?.addEvent("disconnected");
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

	protected emit(event: string, data: unknown): void {
		const eventListeners = this._listeners.get(event);
		if (eventListeners) {
			for (const listener of eventListeners) {
				try {
					listener(data);
				} catch (error) {
					span()?.addEvent("listenerError", { event, error: String(error) });
				}
			}
		}
	}

	protected sendRaw(data: unknown): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(data));
		}
	}

	isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}

	getState(): number | null {
		return this.ws?.readyState ?? null;
	}
}
