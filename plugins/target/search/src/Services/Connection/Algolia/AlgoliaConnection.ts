import algoliasearch, { SearchIndex } from "algoliasearch";

import SaveServiceData from "../../models/Data";
import Connection, { ResponseData } from "../Connection";
import AlgoliaConfig from "./AlgoliaConfig";

export default class AlgoliaConnection implements Connection {
	private _index: SearchIndex;

	constructor() {
		const config = new AlgoliaConfig().getConfig();
		const client = algoliasearch(config.appId, config.adminKey);
		this._index = client.initIndex(config.indexName);
	}

	async setData(data: SaveServiceData[]) {
		if (!data.length) return;
		await this._index.saveObjects(data);
		// const algoliaResponse =
		// logger.logInfo(`Added records to Algolia. Quantity: ${algoliaResponse.objectIDs.length}.`);
	}

	async resetData(algoliaDatas: SaveServiceData[]): Promise<void> {
		await this._clearSearchData();
		await this.setData(algoliaDatas);
	}

	async deleteData(objectIDs: string[]) {
		if (!objectIDs.length) return;
		await this._index.deleteObjects(objectIDs);
		// const algoliaResponse =
		// logger.logInfo(`Deleted records from Algolia. Quantity: ${algoliaResponse.objectIDs.length}.`);
	}

	async getSearchData(query: string, filters: string[], tag: string): Promise<ResponseData<SaveServiceData>> {
		return await this._index.search<SaveServiceData>(query, {
			facetFilters: [filters],
			attributesToSnippet: ["title:20", "body:20"],
			highlightPreTag: `<${tag}>`,
			highlightPostTag: `</${tag}>`,
		});
	}

	private async _clearSearchData() {
		await this._index.clearObjects();
		// logger.logInfo(`Deleted records from Algolia. Quantity: all.`);
	}
}
