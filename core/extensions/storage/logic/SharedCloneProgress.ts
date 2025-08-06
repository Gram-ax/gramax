import { getExecutingEnvironment } from "@app/resolveModule/env";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import type { CloneProgress } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import assert from "assert";

const BROADCAST_CHANNEL_NAME = "storage-provider";
const CLONES_IN_PROGRESS_KEY = "clones-in-progress";
const BROADCAST_EVENT_TIMEOUT = 6000;
const BROADCAST_CHANNEL =
	typeof BroadcastChannel !== "undefined" && getExecutingEnvironment() !== "cli"
		? new BroadcastChannel(BROADCAST_CHANNEL_NAME)
		: null;

type SharedCloneProgressEvent = {
	type: "progress-update";
	id: string;
	progress: CloneProgress;
};

type OnProgressDone = (progress: CloneProgress) => void;

export class SharedCloneProgress {
	private _id: string;
	private _progress: CloneProgress;
	private _cancelToken: number;
	private _timeout: ReturnType<typeof setTimeout>;
	private _timerDisabled = false;
	private _onDone: OnProgressDone = null;

	constructor(id: string, cancelToken = 0, progress?: CloneProgress) {
		this._id = id;
		this._cancelToken = cancelToken;
		this._progress = progress ?? {
			type: "queue",
			data: {},
		};
	}

	get progress() {
		return this._progress;
	}

	get cancelToken() {
		return this._cancelToken;
	}

	setStarted(hiddenProgress?: boolean) {
		return this.setProgress({
			type: hiddenProgress ? "download-no-progress" : "started",
			data: {},
		});
	}

	setStartedSilent() {
		return this.setProgress({
			type: "download-no-progress",
			data: {},
		});
	}

	withCancelToken(cancelToken: number) {
		this._cancelToken = cancelToken;
		return this;
	}

	onDone(callback: OnProgressDone) {
		this._onDone = callback;
		return this;
	}

	disableTimer() {
		this._timerDisabled = true;
		clearTimeout(this._timeout);
		return this;
	}

	startEventWaitTimer(ms: number) {
		clearTimeout(this._timeout);

		if (this._timerDisabled) return this;
		if (this.progress.type === "finish" || this.progress.type === "error") return this;

		const previousProgress = this.progress;

		this._timeout = setTimeout(() => {
			if (previousProgress !== this.progress) {
				this.startEventWaitTimer(ms);
				return;
			}

			const error = new DefaultError(
				`Clone progress event waiting timed out (${BROADCAST_EVENT_TIMEOUT}ms)`,
				null,
				{
					errorCode: GitErrorCode.CloneError,
				},
			);

			this.setError(error, false);
		}, ms);

		return this;
	}

	clearEventWaitTimer() {
		clearTimeout(this._timeout);
		return this;
	}

	setProgress(p: CloneProgress, emit = true) {
		this._progress = p;
		if (p.type === "finish" || p.type === "error") this._onDone?.(p);
		if (emit) this._emit();
		return this;
	}

	setError(error: DefaultError, emit = true) {
		return this.setProgress(
			{
				type: "error",
				data: {
					error,
				},
			},
			emit,
		);
	}

	setFinish(isCancelled: boolean, emit = true) {
		return this.setProgress(
			{
				type: "finish",
				data: { isCancelled },
			},
			emit,
		);
	}

	private _emit() {
		BROADCAST_CHANNEL?.postMessage({ type: "progress-update", id: this._id, progress: this._progress });
	}
}

export default class SharedCloneProgressManager {
	private _progress = new Map<string, SharedCloneProgress>();

	constructor() {
		this._subscribeBroadcastEvents();
	}

	createProgress(id: string, save: boolean): SharedCloneProgress {
		const progress = new SharedCloneProgress(id, 0, null);
		this._progress.set(id, progress);
		if (save) this._saveAsInProgress(id);
		return progress;
	}

	getProgress(id: string) {
		const progress = this._progress.get(id);

		if (!progress) {
			this._progress.delete(id);
			this.disposeProgress(id);
		}

		return progress;
	}

	disposeProgress(id: string) {
		this._progress.delete(id);
	}

	hasSavedAsInProgress(id: string) {
		if (typeof window === "undefined" || typeof window.localStorage === "undefined") return false;
		const current = window.localStorage.getItem(CLONES_IN_PROGRESS_KEY);
		return current ? JSON.parse(current).includes(id) : false;
	}

	getAllSavedAsInProgress(): string[] {
		if (typeof window === "undefined" || typeof window.localStorage === "undefined") return [];
		const current = window.localStorage.getItem(CLONES_IN_PROGRESS_KEY);
		return current ? JSON.parse(current) : [];
	}

	removeAsInProgress(id: string) {
		if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;
		const current = window.localStorage.getItem(CLONES_IN_PROGRESS_KEY);
		if (!current) return;
		window.localStorage.setItem(
			CLONES_IN_PROGRESS_KEY,
			JSON.stringify(JSON.parse(current).filter((p) => p !== id)),
		);
	}

	private _saveAsInProgress(id: string) {
		if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;
		const current = window.localStorage.getItem(CLONES_IN_PROGRESS_KEY);
		if (!current) return window.localStorage.setItem(CLONES_IN_PROGRESS_KEY, JSON.stringify([id]));
		window.localStorage.setItem(CLONES_IN_PROGRESS_KEY, JSON.stringify([...JSON.parse(current), id]));
	}

	private _subscribeBroadcastEvents() {
		BROADCAST_CHANNEL?.addEventListener("message", (e) => {
			const ev = e.data as SharedCloneProgressEvent;
			assert(ev.type === "progress-update");

			const progress = this._progress.get(ev.id);
			progress?.setProgress(ev.progress, false);
		});
	}
}
