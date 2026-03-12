import type { ModulithService, SearchBatchArgs } from "@ext/serach/modulith/ModulithService";
import type Searcher from "@ext/serach/Searcher";
import type {
	ProgressArgs,
	SearchAllArgs,
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

	async searchAll({
		query,
		catalogToArticleIds,
		propertyFilter,
		resourceFilter,
		articlesLanguage,
	}: SearchAllArgs): Promise<SearchResult[]> {
		const catalogNames = [];
		const articleIds = [];
		for (const catalogName in catalogToArticleIds) {
			catalogNames.push(catalogName);
			articleIds.push(...catalogToArticleIds[catalogName]);
		}

		const result = (
			await this._searchImpl(
				{
					items: [
						{
							query,
							catalogNames,
							propertyFilter,
							resourceFilter,
							articlesLanguage,
						},
					],
				},
				[articleIds],
			)
		)[0];

		return result;
	}

	async search({
		query,
		catalogName,
		articleIds,
		propertyFilter,
		resourceFilter,
		articlesLanguage,
	}: SearchArgs): Promise<SearchResult[]> {
		return (
			await this._searchImpl(
				{
					items: [
						{
							query,
							catalogNames: [catalogName],
							propertyFilter,
							resourceFilter,
							articlesLanguage,
						},
					],
				},
				[articleIds],
			)
		)[0];
	}

	private async _searchImpl(args: SearchBatchArgs, articleIdsByBatch: string[][]): Promise<SearchResult[][]> {
		const dbResults = await this._service.searchBatch(args);
		return dbResults.map((dbResult, i) => {
			const articleIds = articleIdsByBatch[i];
			return dbResult
				.filter((x) => x.type === "catalog" || (x.type === "article" && articleIds.includes(x.refPath)))
				.map<SearchResult>((x) => {
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
