import { ModulithService, SearchBatchArgs } from "@ext/serach/modulith/ModulithService";
import Searcher, {
	SearchAllArgs,
	SearchArgs,
	SearcherProgressGenerator,
	SearchResult,
	UpdateIndexArgs,
} from "@ext/serach/Searcher";

export class ModulithSearcher implements Searcher {
	constructor(private readonly _service: ModulithService) {}

	progress(): SearcherProgressGenerator {
		return this._service.progress();
	}

	updateIndex({ force, catalogName }: UpdateIndexArgs): SearcherProgressGenerator {
		return this._service.updateIndex({
			force,
			catalogName,
		});
	}

	async searchAll({
		query,
		catalogToArticleIds,
		propertyFilter,
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
