export enum RwLockState {
	Unlocked = 0,
	Write = 1,
	Read = 2,
}

export class RwLockContainer<T> {
	constructor(private _data: T, private _lock: RwLock) {}

	state() {
		return this._lock.state();
	}

	async write(fn: (prev: T) => Promise<T> | T): Promise<void> {
		const free = await this._lock.write();
		try {
			this._data = await this.onWrite(await fn(this._data));
		} finally {
			free();
		}
	}

	async read(): Promise<T>;
	async read<R>(fn: (data: T) => Promise<R> | R): Promise<R>;

	async read<R = T>(fn?: (data: T) => Promise<R> | R): Promise<R> {
		const free = await this._lock.read();
		try {
			const data = await this.onRead(this._data);
			return fn ? await fn(data) : (data as unknown as R);
		} finally {
			free();
		}
	}

	async isNull() {
		const free = await this._lock.read();
		const res = !this._data;
		free();
		return res;
	}

	protected onWrite(prev: T): Promise<T> | T {
		return prev;
	}

	protected onRead(data: T): Promise<T> | T {
		return data;
	}
}

export class RwLock {
	private _readers = 0;
	private _writer = false;
	private _readQueue: (() => void)[] = [];
	private _writeQueue: (() => void)[] = [];

	constructor() {}

	static store<T>(data: T) {
		return new RwLockContainer(data, new RwLock());
	}

	state(): RwLockState {
		if (this._writer) return RwLockState.Write;
		if (this._readers > 0) return RwLockState.Read;
		return RwLockState.Unlocked;
	}

	async read(): Promise<() => void> {
		const canReadImmediately = !this._writer && this._writeQueue.length === 0;
		if (!canReadImmediately) await new Promise<void>((resolve) => this._readQueue.push(resolve));

		this._readers++;
		return () => {
			this._readers--;
			this._dispatch();
		};
	}

	async write(): Promise<() => void> {
		const canWriteImmediately = !this._writer && this._readers === 0;
		if (!canWriteImmediately) {
			await new Promise<void>((resolve) => this._writeQueue.push(resolve));
		}

		this._writer = true;
		return () => {
			this._writer = false;
			this._dispatch();
		};
	}

	private _dispatch() {
		if (!this._writer && this._readers === 0 && this._writeQueue.length > 0) {
			const next = this._writeQueue.shift();
			next && next();
		} else if (!this._writer && this._writeQueue.length === 0 && this._readQueue.length > 0) {
			while (this._readQueue.length > 0) {
				const next = this._readQueue.shift();
				next && next();
			}
		}
	}
}
