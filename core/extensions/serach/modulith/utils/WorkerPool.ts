import { SemaphoreLock } from "@ics/modulith-utils";

export interface PoolWorker {
	terminate(): Promise<void>;
	addEventListener(type: "error", listener: (ev: unknown) => void): void;
	removeEventListener(type: "error", listener: (ev: unknown) => void): void;
}

export class WorkerPool<TWorker extends PoolWorker> {
	private readonly _lock: SemaphoreLock;
	private _workerTimers: Map<TWorker, NodeJS.Timeout | null> = new Map();
	private _idleWorkers: TWorker[] = [];

	constructor(
		maxWorkers: number,
		private readonly _idleTimeoutMs: number,
		private readonly _createWorker: () => TWorker | Promise<TWorker>,
	) {
		this._lock = new SemaphoreLock(maxWorkers);
	}

	async run<T>(task: (worker: TWorker) => T | Promise<T>): Promise<T> {
		const release = await this._lock.lock();

		let worker: TWorker;

		if (this._idleWorkers.length > 0) {
			// Taking idle worker and stopping its terminate timer
			worker = this._idleWorkers.pop()!;
			const timeout = this._workerTimers.get(worker);
			if (timeout) clearTimeout(timeout);
			this._workerTimers.set(worker, null);
		} else {
			// Creating new worker
			worker = await this._createWorker();
			this._workerTimers.set(worker, null);
		}

		let rejectOnWorkerError: ((reason: unknown) => void) | undefined;
		let failed = false;
		const onWorkerError = (event: unknown) => {
			failed = true;
			rejectOnWorkerError?.(new Error("Worker crashed while handling task", { cause: event }));
			void this._terminateWorker(worker);
		};
		worker.addEventListener("error", onWorkerError);

		try {
			return await Promise.race([
				task(worker),
				new Promise<T>((_resolve, reject) => {
					rejectOnWorkerError = reject;
				}),
			]);
		} finally {
			worker.removeEventListener("error", onWorkerError);
			release();

			if (!failed) {
				// Starting terminate timer
				const timeout = setTimeout(() => void this._terminateWorker(worker), this._idleTimeoutMs);
				this._workerTimers.set(worker, timeout);
				this._idleWorkers.push(worker);
			}
		}
	}

	async terminate() {
		for (const [worker, timeout] of this._workerTimers) {
			if (timeout) clearTimeout(timeout);
			await worker.terminate();
		}

		this._workerTimers.clear();
		this._idleWorkers = [];
	}

	private async _terminateWorker(worker: TWorker) {
		if (!this._workerTimers.has(worker)) return;

		const timeout = this._workerTimers.get(worker);
		if (timeout) clearTimeout(timeout);

		await worker.terminate();
		this._workerTimers.delete(worker);
		this._idleWorkers = this._idleWorkers.filter((x) => x !== worker);
	}
}
