export type FsEventsBatcherOptions = {
	flushDelayMs?: number;
	maxDelayMs?: number;
	canFlush?: () => boolean;
	onError?: (error: unknown) => void;
};

const DEFAULT_FLUSH_DELAY_MS = 150;
const DEFAULT_MAX_DELAY_MS = 1000;

export default class FsEventsBatcher<T> {
	private _queue: T[] = [];
	private _firstEventInBatchTime: number | undefined;
	private _flushTimer: ReturnType<typeof setTimeout> | undefined;
	private _isFlushing = false;
	private _stopped = false;

	constructor(
		private _flushEvents: (events: T[]) => Promise<void> | void,
		private _options: FsEventsBatcherOptions = {},
	) {}

	enqueue(events: T[]): void {
		if (this._stopped) return;
		this._queue.push(...events);

		if (this._isFlushing || !this.canFlush()) return;

		const now = Date.now();
		if (!this._firstEventInBatchTime) this._firstEventInBatchTime = now;

		if (now - this._firstEventInBatchTime >= (this._options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS)) {
			void this.flushNow();
			return;
		}

		this._scheduleFlush();
	}

	async flushNow(): Promise<void> {
		if (this._stopped) return;
		if (!this.canFlush()) return;
		if (this._isFlushing) return;

		this._clearTimer();
		this._isFlushing = true;

		try {
			while (this._queue.length && !this._stopped) {
				this._firstEventInBatchTime = undefined;
				const events = this._queue.splice(0);
				await this._flushEvents(events);
			}
		} catch (error) {
			this._options.onError?.(error);
		} finally {
			this._isFlushing = false;
			if (this._queue.length && !this._stopped) this._scheduleFlush();
		}
	}

	stop(): void {
		this._stopped = true;
		this._clearTimer();
		this._queue = [];
		this._firstEventInBatchTime = undefined;
	}

	canFlush(): boolean {
		return this._options.canFlush?.() ?? true;
	}

	private _scheduleFlush(): void {
		if (!this.canFlush()) return;
		this._clearTimer();
		this._flushTimer = setTimeout(() => void this.flushNow(), this._options.flushDelayMs ?? DEFAULT_FLUSH_DELAY_MS);
	}

	private _clearTimer(): void {
		if (!this._flushTimer) return;
		clearTimeout(this._flushTimer);
		this._flushTimer = undefined;
	}
}
