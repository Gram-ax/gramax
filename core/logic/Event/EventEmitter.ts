type FilterNever<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K];
};

type EventFnRet = Promise<void | boolean> | boolean | void;

type EventUnknownFn = (args: unknown) => EventFnRet;

type EventInner<N extends string, P extends object = undefined, R = EventFnRet> = {
	[K in N]: P extends never ? never : EventFn<P, R>;
};

export interface HasEvents<E extends EventPlaceholder> {
	events: EventListener<E>;
}

export type EventArgs<E extends EventPlaceholder, N extends keyof E> = Parameters<E[N]>[0];

export type EventPlaceholder = { [name: string]: EventUnknownFn };

export type EventFn<P, R> = (payload: P) => R;

export type Event<N extends string, Args extends object = object> = FilterNever<EventInner<N, Args>>;

export type EventListener<E extends EventPlaceholder> = Omit<EventEmitter<E>, "emit">;

export type UnsubscribeToken = { key: WeakKey };

export class EventEmitter<Events extends EventPlaceholder> {
	private _listeners = new Map<keyof Events, [WeakRef<UnsubscribeToken>, EventUnknownFn][]>();

	on<Key extends keyof Events, Handler extends Events[Key]>(event: Key, handler: Handler): UnsubscribeToken {
		const unsubsribeToken = { key: Symbol() };
		this._ensureEventExist(event);
		const validated = this._listeners.get(event).filter((h) => !!h[0].deref());
		this._listeners.set(event, validated);
		this._listeners.get(event).push([new WeakRef(unsubsribeToken), handler]);
		return unsubsribeToken;
	}

	off(unsubsribeToken: UnsubscribeToken): void {
		for (const events of this._listeners.values()) {
			const idx = events.findIndex((listener) => listener[0]?.deref() == unsubsribeToken);
			if (idx == -1) continue;
			events.splice(idx, 1);
			return;
		}
	}

	async emit<Key extends keyof Events, Fn extends Events[Key]>(
		event: Key,
		args: Parameters<Fn>[0],
	): Promise<void | boolean> {
		this._ensureEventExist(event);
		const res = await Promise.all(this._listeners.get(event).map((v) => v[1](args)));
		return !res.includes(false);
	}

	emitSync<Key extends keyof Events, Fn extends Events[Key]>(event: Key, args: Parameters<Fn>[0]): void | boolean {
		this._ensureEventExist(event);

		const res = this._listeners.get(event).map((v) => {
			const res = v[1](args);
			if (res instanceof Promise)
				throw new Error(`Sync event handler expected for '${event.toString()}' but async was provided`);
			return res;
		});

		return !res.includes(false);
	}

	private _ensureEventExist(event: keyof Events) {
		if (!this._listeners.has(event)) this._listeners.set(event, []);
	}
}

export const createEventEmitter = <Events extends EventPlaceholder = never>() => new EventEmitter<Events>();
