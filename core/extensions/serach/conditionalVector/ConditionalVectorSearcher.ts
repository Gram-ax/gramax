import Searcher, { SearchItem } from "@ext/serach/Searcher";
import { VectorSearcher } from "@ext/serach/vector/VectorSearcher";

export class ConditionalVectorSearcher implements Searcher {
	private readonly _prefix = "v!";

	constructor(private readonly _defaultSearcher: Searcher, private readonly _vectorSearcher: VectorSearcher) {}

	async resetAllCatalogs(): Promise<void> {
		await this._defaultSearcher.resetAllCatalogs();
		await this._vectorSearcher.resetAllCatalogs();
	}

	searchAll(query: string, ids: { [catalogName: string]: string[] }): Promise<SearchItem[]> {
		if (query.startsWith(this._prefix)) {
			return this._vectorSearcher.searchAll(query.substring(this._prefix.length), ids);
		}

		return this._defaultSearcher.searchAll(query, ids);
	}

	search(query: string, catalogName: string, id: string[]): Promise<SearchItem[]> {
		if (query.startsWith(this._prefix)) {
			return this._vectorSearcher.search(query.substring(this._prefix.length), catalogName, id);
		}

		return this._defaultSearcher.search(query, catalogName, id);
	}
}
