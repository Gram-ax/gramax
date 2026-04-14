import type { ModulithService, SearchBatchArgs } from "@ext/serach/modulith/ModulithService";
import type Searcher from "@ext/serach/Searcher";
import type {
	ProgressArgs,
	SearchArgs,
	SearcherProgressGenerator,
	SearchResult,
	UpdateIndexArgs,
} from "@ext/serach/Searcher";

export class ModulithSearcher implements Searcher {
	constructor(private readonly _service: ModulithService) {}

	progress(args: ProgressArgs): SearcherProgressGenerator {
		return this._service.progress(args);
	}

	async updateIndex({ force, catalogName }: UpdateIndexArgs): Promise<void> {
		return await this._service.updateIndex({ force, catalogName });
	}

	async search({
		query,
		articleRefPaths,
		propertyFilter,
		resourceFilter,
		articlesLanguage,
	}: SearchArgs): Promise<SearchResult[]> {
		return (
			await this._searchImpl({
				items: [
					{
						query,
						articleRefPaths,
						propertyFilter,
						resourceFilter,
						articlesLanguage,
					},
				],
			})
		)[0];
	}

	private async _searchImpl(args: SearchBatchArgs): Promise<SearchResult[][]> {
		const dbResults = await this._service.searchBatch(args);
		return dbResults.map((dbResult) => {
			return dbResult.map<SearchResult>((x) => {
				if (x.type === "catalog") {
					return {
						type: "catalog",
						name: x.catalogName,
						title: x.title,
						url: x.url,
					};
				}

				return {
					type: "article",
					refPath: x.refPath,
					isRecommended: x.isRecommended,
					catalog: x.catalog,
					title: x.title,
					items: x.items,
					url: x.url,
					breadcrumbs: x.breadcrumbs,
					properties: x.properties,
				};
			});
		});
	}
}
