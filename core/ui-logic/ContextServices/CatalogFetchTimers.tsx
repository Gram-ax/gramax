abstract class CatalogFetchTimersSerivce {
	private static _localStorageName = "CatalogFetchTimers";
	private static _delayBetweenFetch = 300000; // 5 mins
	static fetchIntervalDelay = 300000 + 100; // 5 mins

	static setTimer(catalogName: string) {
		const catalogFetchTimers = this._getCatalogFetchTimers();
		catalogFetchTimers[catalogName] = new Date().getTime();
		window.localStorage.setItem(this._localStorageName, JSON.stringify(catalogFetchTimers));
	}

	static canFetch(catalogName: string): boolean {
		const timer = this._getCatalogFetchTimers()[catalogName];
		if (!timer) return true;
		return new Date().getTime() - timer > this._delayBetweenFetch;
	}

	private static _getCatalogFetchTimers(): { [catalogName: string]: number } {
		const data = window.localStorage.getItem(this._localStorageName);
		if (!data) return {};
		return JSON.parse(data);
	}
}

export default CatalogFetchTimersSerivce;
