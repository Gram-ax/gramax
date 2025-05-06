import Searcher from "@ext/serach/Searcher";

const searcherTypes = ["vector"] as const;

export type SearcherType = (typeof searcherTypes)[number];

export function isSearcherType(str: string): str is SearcherType {
	return searcherTypes.some((x) => x === str);
}

export default class SearcherManager {
	constructor(
		private readonly _defaultSearcher: Searcher,
		private readonly _extraSearchers: Record<SearcherType, Searcher>,
	) {}

	getSearcher(type?: SearcherType): Searcher {
		if (type) {
			const searcher = this._extraSearchers[type];
			if (!searcher) throw new Error(`Searcher of type ${type} not found`);

			return searcher;
		}

		return this._defaultSearcher;
	}
}
