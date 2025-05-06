import { ResponseKind } from "@app/types/ResponseKind";
import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import Context from "@core/Context/Context";
import RuleProvider from "@ext/rules/RuleProvider";
import { SearchItem } from "@ext/serach/Searcher";
import { isSearcherType, SearcherType } from "@ext/serach/SearcherManager";
import { Command } from "../../types/Command";

const searchCommand: Command<{ ctx: Context; type?: SearcherType; catalogName?: string; query: string }, SearchItem[]> =
	Command.create({
		path: "search/searchCommand",

		kind: ResponseKind.json,

		async do({ ctx, query, type, catalogName }) {
			const getCatalogItemsIds = async (catalogName: string, requireExactLanguageMatch = false) => {
				const filters = new RuleProvider(ctx).getItemFilters({ requireExactLanguageMatch });
				const catalog = await this._app.wm.current().getContextlessCatalog(catalogName);
				const articles = catalog?.getItems(filters) ?? [];
				return articles.map((a) => a.ref.path.value);
			};

			const getSearchData = async (query: string, catalogName: string) => {
				const search = async (query: string) => {
					const result = await this._app.searcherManager
						.getSearcher(type)
						.search(query, catalogName, await getCatalogItemsIds(catalogName, true));
					return result;
				};

				return (await multiLayoutSearcher<SearchItem[]>(search)(query)) ?? [];
			};

			const getAllSearchData = async (query: string) => {
				const catalogs = Array.from(this._app.wm.current().getAllCatalogs().keys());
				const catalogArticleIds = {};
				await Promise.all(catalogs.map(async (c) => (catalogArticleIds[c] = await getCatalogItemsIds(c))));
				const search = async (query: string) => {
					const result = await this._app.searcherManager
						.getSearcher(type)
						.searchAll(query, catalogArticleIds);
					return result;
				};

				return (await multiLayoutSearcher<SearchItem[]>(search)(query)) ?? [];
			};

			return catalogName ? await getSearchData(query, catalogName) : await getAllSearchData(query);
		},

		params(ctx, q) {
			const query = q.query;
			const catalogName = q.catalogName;
			const type = isSearcherType(q.type) ? q.type : null;
			return { ctx, catalogName, type, query };
		},
	});

export default searchCommand;
