import { getExecutingEnvironment } from "@app/resolveModule/env";

type StashCache = Record<string, StashCacheItem[]>;
type StashCacheItem = { oid: string; time: string };

const MAX_STASH_CACHE_ITEMS = 20;
const MAX_CATALOGS = 20;

export default class BrowserStashCache {
	private static readonly _localStorageKey = "last-stash-cache";

	static getStashCache(catalogName: string): StashCacheItem[] {
		if (!this._validate()) return [];

		const data = this.getAllStashCaches();
		return data[catalogName];
	}

	static getAllStashCaches(): StashCache {
		if (!this._validate()) return {};

		const cache = localStorage.getItem(BrowserStashCache._localStorageKey);
		return (cache ? JSON.parse(cache) : {}) as StashCache;
	}

	static setStashCache(catalogName: string, oid: string) {
		if (!this._validate()) return;

		const cache = localStorage.getItem(BrowserStashCache._localStorageKey);
		const data = (cache ? JSON.parse(cache) : {}) as StashCache;

		data[catalogName] = [{ oid, time: new Date().toJSON() }, ...(data[catalogName] || [])];
		if (data[catalogName].length > MAX_STASH_CACHE_ITEMS) {
			data[catalogName] = data[catalogName].slice(0, MAX_STASH_CACHE_ITEMS);
		}

		BrowserStashCache._deleteOldestCatalog(data);

		localStorage.setItem(BrowserStashCache._localStorageKey, JSON.stringify(data));
	}

	private static _deleteOldestCatalog(data: StashCache) {
		if (Object.keys(data).length <= MAX_CATALOGS) return;

		const catalogsWithTime = Object.entries(data)
			.map(([catalog, items]) => ({
				catalog,
				oldestTime: items[0]?.time || "",
			}))
			.filter((c) => c.oldestTime)
			.sort((a, b) => new Date(a.oldestTime).getTime() - new Date(b.oldestTime).getTime());

		if (catalogsWithTime.length > 0) {
			const oldestCatalog = catalogsWithTime[0].catalog;
			delete data[oldestCatalog];
		}
	}

	private static _validate() {
		const env = getExecutingEnvironment();
		if (env !== "browser" && env !== "tauri") return false;
		if (typeof window === "undefined" || !window.localStorage) return false;
		return true;
	}
}
