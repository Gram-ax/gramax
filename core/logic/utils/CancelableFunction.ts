export class CancelableFunction<T> {
	private _abortController = new AbortController();
	private _abortSignal = this._abortController.signal;

	public get aborted(): boolean {
		return this._abortSignal.aborted;
	}

	constructor(private _functionToStart: (signal: AbortSignal) => Promise<T>) {}

	start(): Promise<T> {
		return new Promise((resolve, reject) => {
			this._abortSignal.addEventListener("abort", () => reject(new Error(this._abortSignal.reason)));
			this._functionToStart(this._abortSignal).then(resolve).catch(reject);
		});
	}

	abort(): void {
		this._abortController.abort();
	}

	rearm(): void {
		this._abortController = new AbortController();
		this._abortSignal = this._abortController.signal;
	}
}
