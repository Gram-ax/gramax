export class TrailingThrottler<T> {
	private _timer: ReturnType<typeof setTimeout> | null = null;
	private _pending: T | null = null;
	private _hasPending = false;

	constructor(
		private readonly _intervalMs: number,
		private readonly _emit: (value: T) => void,
	) {}

	push(value: T): void {
		this._pending = value;
		this._hasPending = true;
		if (this._timer === null) this._timer = setTimeout(() => this.flush(), this._intervalMs);
	}

	flush(): void {
		if (this._timer !== null) {
			clearTimeout(this._timer);
			this._timer = null;
		}
		if (!this._hasPending) return;
		const value = this._pending as T;
		this._pending = null;
		this._hasPending = false;
		this._emit(value);
	}
}
