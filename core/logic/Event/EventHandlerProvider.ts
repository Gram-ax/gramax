import type { EventPlaceholder, HasEvents } from "@core/Event/EventEmitter";

export interface EventHandlerCollection<E extends EventPlaceholder = EventPlaceholder> {
	mount(to: HasEvents<E>): void;
}

export default class EventHandlerProvider<E extends EventPlaceholder = EventPlaceholder> {
	protected _handlers: EventHandlerCollection[];

	mount(on: HasEvents<E>) {
		for (const handler of this._handlers) handler.mount(on);
	}
}
