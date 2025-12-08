import {
	ModulithSearchClient,
	SearchBatchArgs,
	SearchResult,
	UpdateArgs,
} from "@ext/serach/modulith/ModulithSearchClient";
import { SearchService } from "@ics/modulith-search-domain/search";

const tenant = "local";

export interface LocalModulithSearchClientOptions {
	searchService: SearchService;
}

export class LocalModulithSearchClient implements ModulithSearchClient {
	constructor(private readonly _options: LocalModulithSearchClientOptions) {}

	async update({ articles, filter, progressCallback }: UpdateArgs): Promise<void> {
		await this._options.searchService.updateAndWait({
			tenant,
			articles,
			filter,
			progressCallback,
		});
	}

	searchBatch(args: SearchBatchArgs): Promise<SearchResult[][]> {
		return this._options.searchService.search({
			tenant,
			items: args.items.map((x) => ({
				searchText: x.query,
				filter: x.filter,
			})),
		});
	}
}
