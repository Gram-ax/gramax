import { AggregateProgress, DynamicAggregateProgress, type ProgressCallback } from "@ics/article-search-utils";

export interface ProgressManager {
	addProgressSubscriber(pc: ProgressCallback): void;
	removeProgressSubscriber(pc: ProgressCallback): void;
	addProgress(): unknown;
	getTotalProgress(): number;
	getProgressCallback(prid: unknown): ProgressCallback;
	hasProgresses(): boolean;
	doneProgress(prid: unknown): void;
}

export class NullProgressManager implements ProgressManager {
	private static readonly _instance = new NullProgressManager();
	static instance() {
		return this._instance;
	}

	addProgressSubscriber(_pc: ProgressCallback): void {}
	removeProgressSubscriber(_pc: ProgressCallback): void {}
	addProgress(): unknown {
		return 0;
	}
	getTotalProgress(): number {
		return 1;
	}
	getProgressCallback(_prid: unknown): ProgressCallback {
		return () => {};
	}
	hasProgresses(): boolean {
		return false;
	}
	doneProgress(_prid: unknown): void {}
}

export class DefaultProgressManager implements ProgressManager {
	private readonly _subscribers = new Set<ProgressCallback>();
	private readonly _doneProgresses = new Set<unknown>();
	private readonly _progress = new DynamicAggregateProgress({
		onChange: (p) => {
			const progess = this._progress.getProgressesCount() === 0 ? 1 : p;
			return this._subscribers.forEach((x) => x(progess));
		},
	});

	addProgressSubscriber(pc: ProgressCallback): void {
		this._subscribers.add(pc);
	}

	removeProgressSubscriber(pc: ProgressCallback): void {
		this._subscribers.delete(pc);
	}

	addProgress(): unknown {
		return this._progress.addProgress();
	}

	getTotalProgress(): number {
		return this._progress.getTotalProgress();
	}

	getProgressCallback(prid: unknown): ProgressCallback {
		return this._progress.getProgressCallback(prid);
	}

	hasProgresses(): boolean {
		return this._progress.getProgressesCount() > 0;
	}

	doneProgress(prid: unknown) {
		this._doneProgresses.add(prid);
		if (this._doneProgresses.size === this._progress.getProgressesCount()) {
			this._doneProgresses.forEach((x) => this._progress.removeProgress(x));
			this._doneProgresses.clear();
		}
	}
}

export class CombinedProgressManager {
	private readonly _subscribers = new Map<ProgressCallback, ProgressCallback[]>();

	constructor(private readonly _pms: ProgressManager[]) {}

	addProgressSubscriber(pc: ProgressCallback): void {
		const aggProgress = new AggregateProgress({
			progress: {
				init: this._pms.map((x) => x.getTotalProgress()),
				count: this._pms.length,
			},
			onChange: (p) => pc(p),
		});

		const callbacks = this._pms.map((x, i) => {
			const pc = aggProgress.getProgressCallback(i);
			x.addProgressSubscriber(pc);
			return pc;
		});

		this._subscribers.set(pc, callbacks);
	}

	removeProgressSubscriber(pc: ProgressCallback): void {
		const callbacks = this._subscribers.get(pc);
		if (callbacks) {
			this._subscribers.delete(pc);
			this._pms.forEach((x, i) => x.removeProgressSubscriber(callbacks[i]));
		}
	}

	getTotalProgress(): number {
		const aggProgress = new AggregateProgress({
			progress: {
				init: this._pms.map((x) => x.getTotalProgress()),
				count: this._pms.length,
			},
		});

		return aggProgress.getTotalProgress();
	}

	hasProgresses(): boolean {
		return this._pms.some((x) => x.hasProgresses());
	}
}
