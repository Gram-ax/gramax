import Searcher, { SearchItem } from "@ext/serach/Searcher";
import VectorDatabaseClient from "@ext/serach/vector/VectorDatabaseClient";


export class VectorSearcher implements Searcher {
	constructor(private readonly _vectorDbClient: VectorDatabaseClient) {}

	async resetAllCatalogs(): Promise<void> {
		this._vectorDbClient.updateAllCatalogs();
	}

	async searchAll(query: string, ids: { [catalogName: string]: string[] }): Promise<SearchItem[]> {
		const result: SearchItem[] = [];

		for (const catalogName in ids) {
			const searchResult = await this.search(query, catalogName, ids[catalogName]);
			result.push(...searchResult);
		}

		return result.length
			? result.sort((a, b) => {
					if (a.count === b.count) return b.score - a.score;
					return b.count - a.count;
			  })
			: null;
	}

	async search(query: string, catalogName: string, articleIds: string[]): Promise<SearchItem[]> {
		const dbResult = await this._vectorDbClient.search(query, catalogName);
		return dbResult.items
			.filter((x) => articleIds.includes(x.metadata.refPath))
			.map<SearchItem>((x) => ({
				name: { end: "", targets: [{ start: x.metadata.title, target: "" }] },
				count: 1,
				score: x.score,
				paragraph: [{ prev: x.text, target: "", next: "" }],
				url: x.metadata.logicPath,
			}))
			.sort((a, b) => b.score - a.score);
	}
}
