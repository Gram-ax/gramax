import SaveServiceData from "../../models/Data";
import Connection, { ResponseData } from "../Connection";
import TypesenseConfig from "./TypesenseConfig";

import { Client } from "typesense";
import Collection from "typesense/lib/Typesense/Collection";
import { CollectionCreateSchema } from "typesense/lib/Typesense/Collections";
import { SearchParams } from "typesense/lib/Typesense/Documents";

export default class TypesenseConnection implements Connection {
	private _client: Client;
	private _collectionName: string;

	constructor() {
		const config = new TypesenseConfig().getConfig();
		this._client = new Client(config.config);
		this._collectionName = config.collectionName;
		void this._createCollection();
	}

	async setData(data: SaveServiceData[]) {
		if (!data.length) return;
		const collection = this._getCollection();
		await collection.documents().import(data);
		// .then((response) => /* logger.logInfo(`Added documents to Typesense. Quantity: ${response.length}.`) */ {})
		// .catch((err) => /* logger.logError(err) */ {});
	}

	async resetData(data: SaveServiceData[]) {
		const collection = this._getCollection();
		await collection.documents().delete({ filter_by: "objectID: !=0" });
		// .then((	response) => /* logger.logInfo(`Deleted documents from Typesense. Quantity: ${response.num_deleted}.`) */ {})
		// .catch((err) => /* logger.logError(err) */ {});
		await this.setData(data);
	}

	async deleteData(filterIds: string[]) {
		if (!filterIds.length) return;
		const collection = this._getCollection();
		await collection.documents().delete({ filter_by: this._getIdFilders(filterIds) });
		// .then((response) => /* logger.logInfo(`Deleted documents from Typesense. Quantity: ${response.num_deleted}.`) */ {})
		// .catch((err) => /* logger.logError(err) */ {});
	}

	async getSearchData(query: string, filters: string[], tag: string): Promise<ResponseData<SaveServiceData>> {
		const collection = this._getCollection();
		const config: SearchParams = {
			q: query,
			prefix: "true,true",
			query_by: "body,title",
			per_page: 250,
			filter_by: this._getIdFilders(filters.length > 85 ? filters.slice(0, 85) : filters),
			highlight_start_tag: `<${tag}>`,
			highlight_end_tag: `</${tag}>`,
			exhaustive_search: true,
		};
		try {
			const data = await collection.documents().search(config);
			const rdata = {
				hits: data.hits.map((hit) => {
					const snippetResult = {};
					hit.highlights.forEach((highlight) => (snippetResult[highlight.field] = highlight.snippet));
					return {
						_snippetResult: {
							body: { value: snippetResult?.["body"] ?? hit.document.body },
							title: { value: snippetResult?.["title"] ?? hit.document.title },
						},
						objectID: hit.document.objectID,
						logicPath: hit.document.logicPath,
					};
				}),
			} as ResponseData<SaveServiceData>;
			return rdata;
		} catch (err) {
			// logger.logError(err);
			return { hits: [] };
		}
	}

	private async _createCollection(): Promise<void> {
		if (this._client.collections(this._collectionName)) return;
		const collections = this._client.collections();
		const typesenseCollection: CollectionCreateSchema = {
			name: this._collectionName,
			fields: [
				{ name: "objectID", type: "string", facet: false },
				{ name: "logicPath", type: "string", facet: false },
				{ name: "body", type: "string", facet: true },
				{ name: "title", type: "string", facet: true },
			],
		};
		await collections.create(typesenseCollection);
		// .then(() => /* logger.logInfo(`Create new collection from Typesense.`) */ {})
		// .catch((err) => /* logger.logError(err) */ {});
	}

	private _getCollection(): Collection<SaveServiceData> {
		return this._client.collections<SaveServiceData>(this._collectionName);
	}

	private _getIdFilders(filterIds: string[]): string {
		if (!filterIds.length) return "";
		return `objectID:= [${filterIds.join(", ")}]`;
	}
}
