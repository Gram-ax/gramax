export interface EventHandlerCollection {
	mount(): void;
}

export default class EventHandlerProvider {
	protected _handlers: EventHandlerCollection[];

	mount() {
		for (const handler of this._handlers) handler.mount();
	}
}
