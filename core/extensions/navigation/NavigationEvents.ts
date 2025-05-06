import { createEventEmitter, UnsubscribeToken, type Event } from "@core/Event/EventEmitter";

export type NavigationEvents = Event<"item-click", { path: string }> &
	Event<"item-create", { path: string }> &
	Event<"item-delete", { path: string }>;

abstract class NavigationEventsService {
	private static _eventEmitter = createEventEmitter<NavigationEvents>();

	public static on<K extends keyof NavigationEvents>(event: K, listener: NavigationEvents[K]): UnsubscribeToken {
		return this._eventEmitter.on(event, listener);
	}

	public static off(token: UnsubscribeToken): void {
		this._eventEmitter.off(token);
	}

	public static async emit<K extends keyof NavigationEvents>(
		event: K,
		payload: Parameters<NavigationEvents[K]>[0],
	): Promise<void> {
		await this._eventEmitter.emit(event, payload);
	}
}

export default NavigationEventsService;
