import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import RuleProvider from "@ext/rules/RuleProvider";
import { getAccessibleCatalogs } from "@ext/security/logic/getAccessibleCatalogs";
import SecurityRules from "@ext/security/logic/SecurityRules";
import { type ArticleLanguage, isArticleLanguage } from "@ext/serach/modulith/SearchArticle";
import type { PropertyFilter, ResourceFilter, SearchResult } from "@ext/serach/Searcher";
import { isSearcherType, type SearcherType } from "@ext/serach/SearcherManager";
import { Command } from "../../types/Command";

const searchCommand: Command<
	{
		ctx: Context;
		signal?: AbortSignal;
		type?: SearcherType;
		catalogName?: string;
		query: string | undefined;
		propertyFilter?: PropertyFilter;
		resourceFilter?: ResourceFilter;
		articlesLanguage?: ArticleLanguage;
	},
	SearchResult[]
> = Command.create({
	path: "search/searchCommand",

	kind: ResponseKind.json,

	async do({ ctx, signal, query, type, catalogName, propertyFilter, resourceFilter, articlesLanguage }) {
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
					resourceFilter,
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
			const catalogs = getAccessibleCatalogs(ctx.user, this._app.wm.current().getAllCatalogs().values());
			if (catalogs.length === 0) return [];
			const catalogArticleIds: Record<string, string[]> = {};
			await catalogs.forEachAsync(async (c) => {
				catalogArticleIds[c.name] = await getCatalogItemsIds(c.name);
			});
			const search = async (query: string) => {
				const result = await this._app.searcherManager.getSearcher(type).searchAll({
					query,
					catalogToArticleIds: catalogArticleIds,
					propertyFilter,
					resourceFilter,
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

		if (catalogName) {
			const entry = this._app.wm.current().getAllCatalogs().get(catalogName);
			if (!entry || !SecurityRules.canReadCatalog(ctx.user, entry.perms, entry.name)) return [];
			return await getSearchData(query, catalogName);
		}
		return await getAllSearchData(query);
	},

	params(ctx, q, body, signal) {
		const query = q.query;
		const catalogName = q.catalogName;
		const type = isSearcherType(q.type) ? q.type : undefined;
		const propertyFilter = body?.propertyFilter;
		const resourceFilter = body?.resourceFilter;
		const articlesLanguage = isArticleLanguage(q.articlesLanguage) ? q.articlesLanguage : undefined;
		return { ctx, signal, catalogName, type, query, propertyFilter, resourceFilter, articlesLanguage };
	},
});

export default searchCommand;
