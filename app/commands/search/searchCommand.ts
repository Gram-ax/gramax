import { ResponseKind } from "@app/types/ResponseKind";
import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import Context from "@core/Context/Context";
import RuleProvider from "@ext/rules/RuleProvider";
import { ArticleLanguage, isArticleLanguage } from "@ext/serach/modulith/SearchArticle";
import { PropertyFilter, SearchResult } from "@ext/serach/Searcher";
import { isSearcherType, SearcherType } from "@ext/serach/SearcherManager";
import { Command } from "../../types/Command";

const searchCommand: Command<
	{
		ctx: Context;
		signal?: AbortSignal;
		type?: SearcherType;
		catalogName?: string;
		query: string | undefined;
		propertyFilter?: PropertyFilter;
		articlesLanguage?: ArticleLanguage;
	},
	SearchResult[]
> = Command.create({
	path: "search/searchCommand",

	kind: ResponseKind.json,

	async do({ ctx, signal, query, type, catalogName, propertyFilter, articlesLanguage }) {
		const getCatalogItemsIds = async (catalogName: string, requireExactLanguageMatch = false) => {
			const filters = new RuleProvider(ctx).getItemFilters({ requireExactLanguageMatch });
			const catalog = await this._app.wm.current().getContextlessCatalog(catalogName);
			const articles = catalog?.getItems(filters) ?? [];
			return articles.map((a) => a.ref.path.value);
		};

		const getSearchData = async (query: string | undefined, catalogName: string) => {
			const search = async (query: string) => {
				const result = await this._app.searcherManager.getSearcher(type).search({
					query,
					catalogName,
					articleIds: await getCatalogItemsIds(catalogName, true),
					propertyFilter,
					articlesLanguage,
				});
				return result;
			};

			const doSearch = query
				? multiLayoutSearcher<SearchResult[]>({
						searcher: search,
						signal,
				  })
				: search;

			return (await doSearch(query)) ?? [];
		};

		const getAllSearchData = async (query: string | undefined) => {
			const catalogs = Array.from(this._app.wm.current().getAllCatalogs().keys());
			const catalogArticleIds = {};
			await Promise.all(catalogs.map(async (c) => (catalogArticleIds[c] = await getCatalogItemsIds(c))));
			const search = async (query: string) => {
				const result = await this._app.searcherManager.getSearcher(type).searchAll({
					query,
					catalogToArticleIds: catalogArticleIds,
					propertyFilter,
					articlesLanguage,
				});
				return result;
			};

			const doSearch = query
				? multiLayoutSearcher<SearchResult[]>({
						searcher: search,
						signal,
				  })
				: search;

			return (await doSearch(query)) ?? [];
		};

		return catalogName ? await getSearchData(query, catalogName) : await getAllSearchData(query);
	},

	params(ctx, q, body, signal) {
		const query = q.query;
		const catalogName = q.catalogName;
		const type = isSearcherType(q.type) ? q.type : undefined;
		const propertyFilter = body?.propertyFilter;
		const articlesLanguage = isArticleLanguage(q.articlesLanguage) ? q.articlesLanguage : undefined;
		return { ctx, signal, catalogName, type, query, propertyFilter, articlesLanguage };
	},
});

export default searchCommand;
