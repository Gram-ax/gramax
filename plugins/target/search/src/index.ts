import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import { Plugin } from "@core/Plugin";
import FuseSearcher from "plugins/target/search/src/Fuse/FuseSearcher";
import { IndexDataProvider } from "plugins/target/search/src/IndexDataProvider";
import { SearchItem } from "plugins/target/search/src/Searcher";

class SearchPlugin extends Plugin {
	get name() {
		return "search";
	}

	onLoad() {
		this.addCommand({
			name: "searchCommand",
			async do({ query, catalogName }: { query: string; catalogName: string }) {
				const indexDataProvider = new IndexDataProvider(this.app.catalogs, this.app.storage);
				const searcher = new FuseSearcher(indexDataProvider);
				const getCatalogArticleIds = async (catalogName: string) => {
					const catalog = await this.app.catalogs.get(catalogName);

					return catalog?.getArticles().map((a) => a.id);
				};

				const getSearchData = async (query: string, catalogName: string) => {
					const search = async (query: string) => {
						const result = await searcher.search(
							query,
							catalogName,
							await getCatalogArticleIds(catalogName),
						);

						return result.length > 0 ? result : null;
					};

					return (await multiLayoutSearcher<SearchItem[]>(search)(query)) ?? [];
				};

				const getAllSearchData = async (query: string) => {
					const catalogs = (await this.app.catalogs.getAll()).map((l) => l.getName());
					const catalogArticleIds = {};
					await Promise.all(
						catalogs.map(async (c) => (catalogArticleIds[c] = await getCatalogArticleIds(c))),
					);

					const search = async (query: string) => {
						const result = await searcher.searchAll(query, catalogArticleIds);

						return result.length > 0 ? result : null;
					};

					return (await multiLayoutSearcher<SearchItem[]>(search)(query)) ?? [];
				};

				return catalogName ? await getSearchData(query, catalogName) : await getAllSearchData(query);
			},
		});
		this.addCommand({
			name: "resetSearchData",
			async do() {
				const indexDataProvider = new IndexDataProvider(this.app.catalogs, this.app.storage);
				const searcher = new FuseSearcher(indexDataProvider);
				await searcher.resetAllCatalogs();
			},
		});
	}
	onUnload() {}
}

export default SearchPlugin;
