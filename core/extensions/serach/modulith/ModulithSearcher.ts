import { ModulithService, SearchBatchArgs } from "@ext/serach/modulith/ModulithService";
import Searcher, { SearchAllArgs, SearchArgs, SearcherProgressGenerator, SearchResult } from "@ext/serach/Searcher";

export class ModulithSearcher implements Searcher {
	constructor(private readonly _service: ModulithService) {}

	progress(): SearcherProgressGenerator {
		return this._service.progress();
	}

	async resetAllCatalogs(): Promise<void> {
		await this._service.updateAllCatalogs();
	}

	async searchAll({
		query,
		catalogToArticleIds,
		properties,
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
							properties,
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
		properties,
		articlesLanguage,
	}: SearchArgs): Promise<SearchResult[]> {
		return (
			await this._searchImpl(
				{
					items: [
						{
							query,
							catalogNames: [catalogName],
							properties,
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
							url: x.pathname,
						};
					}

					return {
						type: "article",
						isRecommended: x.isRecommended,
						catalog: x.catalog,
						title: x.title,
						items: x.items,
						url: x.pathname,
						breadcrumbs: x.breadcrumbs,
						properties: x.properties,
					};
				});
		});
	}
}
