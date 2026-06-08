import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";

class OfflineRetryScheduler {
	private _retryTimer: ReturnType<typeof setTimeout> | null = null;
	private readonly _retryBaseIntervals = [5_000, 20_000, 60_000, 180_000, 600_000];
	private readonly _retrySwitchInterval = 5;
	private _retryIntervalIndex = 0;
	private _retryIntervalCounter = 0;
	private readonly _onOnline: () => Promise<void>;
	private _basePath = "";
	private _sourceName = "";

	constructor(onOnline: () => Promise<void>) {
		this._onOnline = onOnline;
	}

	async start(basePath: string, sourceName: string): Promise<void> {
		this._basePath = basePath;
		this._sourceName = sourceName;
		await this._performRetry();
	}

	stop(): void {
		if (this._retryTimer) {
			clearTimeout(this._retryTimer);
			this._retryTimer = null;
		}
		this._retryIntervalIndex = 0;
		this._retryIntervalCounter = 0;
	}

	async manualRetry(): Promise<void> {
		const isOnline = await this._checkConnectivity();
		if (isOnline) await this._onOnline();
	}

	private _getCurrentInterval(): number {
		if (this._retryIntervalCounter < this._retrySwitchInterval) this._retryIntervalCounter++;
		else {
			this._retryIntervalCounter = 0;
			this._retryIntervalIndex++;
		}
		if (this._retryIntervalIndex >= this._retryBaseIntervals.length) {
			this._retryIntervalIndex = this._retryBaseIntervals.length - 1;
		}
		return this._retryBaseIntervals[this._retryIntervalIndex];
	}

	private async _checkConnectivity(): Promise<boolean> {
		const controller = new AbortController();
		const apiUrlCreator = new ApiUrlCreator(this._basePath);
		const timeoutId = setTimeout(() => controller.abort(), 4000);
		try {
			const url = apiUrlCreator.getSourceHealthcheck(this._sourceName);
			const res = await FetchService.fetch<{ isHealthy: boolean }>(
				url,
				undefined,
				undefined,
				undefined,
				false,
				undefined,
				controller.signal,
			);
			const data = await res.json();
			return data?.isHealthy ?? false;
		} catch {
			return false;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	private async _performRetry(): Promise<void> {
		const isOnline = await this._checkConnectivity();
		if (isOnline) {
			await this._onOnline();
			return;
		}
		this._retryTimer = setTimeout(() => this._performRetry(), this._getCurrentInterval());
	}
}

export default OfflineRetryScheduler;
