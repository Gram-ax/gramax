import { getExecutingEnvironment } from "@app/resolveModule/env";
import {
	ModulithSearchClient,
	SearchBatchArgs,
	SearchResult,
	UpdateArgs,
} from "@ext/serach/modulith/ModulithSearchClient";
import { SearchArticleMetadata } from "@ext/serach/modulith/SearchArticle";
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

	async searchBatch({ items }: SearchBatchArgs): Promise<SearchResult[][]> {
		const env = getExecutingEnvironment();
		if (env === "browser" || env === "tauri") {
			// TODO: searching in Worker
			await new Promise((resolve) => setTimeout(resolve, 0));
		}

		const res = await this._options.searchService.search<SearchArticleMetadata>({
			tenant,
			items: items.map((x) => ({
				searchText: x.query,
				filter: x.filter,
			})),
		});

		if (env === "browser" || env === "tauri") {
			// TODO: searching in Worker
			await new Promise((resolve) => setTimeout(resolve, 0));
		}

		return res;
	}
}
