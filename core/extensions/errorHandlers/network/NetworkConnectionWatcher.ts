import { createEventEmitter, type Event, type UnsubscribeToken } from "@core/Event/EventEmitter";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import type NetworkError from "@ext/errorHandlers/network/NetworkError";
import { isNetworkErrorPayload } from "@ext/errorHandlers/network/NetworkErrorPayload";
import OfflineRetryScheduler from "@ext/errorHandlers/network/OfflineRetryScheduler";
import { PublishEmitter } from "@ext/git/actions/Publish/logic/PublishEmitter";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";

type ErrorOfflineEvents = Event<"network-error", { error: DefaultError }> & Event<"offline"> & Event<"online">;

class NetworkConnectionWatcher {
	private static _instance: NetworkConnectionWatcher;

	private _events = createEventEmitter<ErrorOfflineEvents>();
	private _isOffline = false;
	private _serviceTokens: UnsubscribeToken[] = [];
	private _initDone = false;
	private _retryScheduler = new OfflineRetryScheduler(() => this._exitOfflineMode());

	private readonly _offlineSources = [
		{
			subscribeError: (handler: (payload: { error: DefaultError }) => void) =>
				SyncService.events.on("error", ({ error }) => handler({ error })),
			subscribeFinish: (handler: () => void) => SyncService.events.on("finish", () => handler()),
		},
		{
			subscribeError: (handler: (payload: { error: DefaultError }) => void) =>
				PublishEmitter.events.on("error", ({ error }) => handler({ error })),
			subscribeFinish: (handler: () => void) => PublishEmitter.events.on("finish", () => handler()),
		},
	];

	static getInstance(): NetworkConnectionWatcher {
		if (!NetworkConnectionWatcher._instance) {
			NetworkConnectionWatcher._instance = new NetworkConnectionWatcher();
		}
		return NetworkConnectionWatcher._instance;
	}

	async manualRetry(): Promise<boolean> {
		if (!this._isOffline) return;
		await this._retryScheduler.manualRetry();
	}

	getEvents() {
		return this._events;
	}

	getIsOffline() {
		return this._isOffline;
	}

	private constructor() {
		this._init();
	}

	private _init() {
		if (this._initDone) return;
		this._initDone = true;

		for (const source of this._offlineSources) {
			this._serviceTokens.push(
				source.subscribeError(async ({ error }) => {
					if (!isNetworkErrorPayload(error)) return;
					await this._events.emit("network-error", { error });
					await this._enterOfflineMode(error as NetworkError);
				}),
			);

			this._serviceTokens.push(
				source.subscribeFinish(async () => {
					await this._exitOfflineMode();
				}),
			);
		}
	}

	private async _enterOfflineMode(error: NetworkError): Promise<void> {
		if (!this._isOffline) {
			this._isOffline = true;
			await this._events.emit("offline", {});
		}
		await this._retryScheduler.start(error.props.basePath, error.props.sourceName);
	}

	private async _exitOfflineMode(): Promise<void> {
		if (!this._isOffline) return;
		this._isOffline = false;
		this._retryScheduler.stop();
		await this._events.emit("online", {});
	}
}

export default NetworkConnectionWatcher.getInstance();
