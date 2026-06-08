import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import { getAccessibleCatalogs } from "@ext/security/logic/getAccessibleCatalogs";
import SecurityRules from "@ext/security/logic/SecurityRules";
import { type ArticleLanguage, isArticleLanguage } from "@ext/serach/modulith/SearchArticle";
import type { PropertyFilter, ResourceFilter, SearchResult } from "@ext/serach/Searcher";
import { isSearcherType, type SearcherType } from "@ext/serach/SearcherManager";
import { getAccessibleArticleIds } from "@ext/serach/utils/getAccessibleArticleIds";
import { getCatalogPropertyFilter } from "@ext/serach/utils/getCatalogPropertyFilter";
import { getDescendantArticleIds } from "@ext/serach/utils/getDescendantArticleIds";
import { Command } from "../../types/Command";

const searchCommand: Command<
	{
		ctx: Context;
		signal?: AbortSignal;
		type?: SearcherType;
		catalogName?: string;
		articleRefFilter?: string;
		query: string | undefined;
		propertyFilter?: PropertyFilter;
		resourceFilter?: ResourceFilter;
		articlesLanguage?: ArticleLanguage;
		catalogNames?: string[];
	},
	SearchResult[]
> = Command.create({
	path: "search/searchCommand",

	kind: ResponseKind.json,

	async do({
		ctx,
		signal,
		query,
		type,
		catalogName,
		articleRefFilter,
		propertyFilter,
		resourceFilter,
		articlesLanguage,
		catalogNames,
	}) {
		const getSearchData = async (
			query: string | undefined,
			articleRefPaths: Set<string>,
			catalogNames?: Set<string>,
			modPropertyFilter?: PropertyFilter,
		) => {
			const search = async (query: string) => {
				const result = await this._app.searcherManager.getSearcher(type).search({
					query,
					articleRefPaths,
					catalogNames,
					propertyFilter: modPropertyFilter ?? propertyFilter,
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

		if (!catalogName) {
			const allCatalogEntries = this._app.wm.current().getAllCatalogs();
			const catalogEntries = catalogNames
				? catalogNames.map((name) => allCatalogEntries.get(name))
				: allCatalogEntries.values();
			const catalogs = getAccessibleCatalogs(ctx.user, catalogEntries);
			if (catalogs.length === 0) return [];
			const articleRefPaths = new Set<string>();
			const catalogNamesSet = new Set<string>();
			await catalogs.forEachAsync(async (c) => {
				catalogNamesSet.add(c.name);
				const catalog = await this._app.wm.current().getContextlessCatalog(c.name);
				(await getAccessibleArticleIds(ctx, catalog)).forEach((id) => articleRefPaths.add(id));
			});

			return await getSearchData(query, articleRefPaths, catalogNamesSet);
		}

		const catalog = await this._app.wm.current().getContextlessCatalog(catalogName);
		if (!catalog || !SecurityRules.canReadCatalog(ctx.user, catalog.perms, catalog.name)) return [];
		const realCatalog = await this._app.wm.current().getContextlessCatalog(BaseCatalog.parseName(catalogName).name);
		const accessibleRefPaths = new Set(await getAccessibleArticleIds(ctx, realCatalog, true));
		let articleRefPaths = new Set<string>();
		if (articleRefFilter) {
			// If there is an articleRefPath, then we filter only this article and its descendant articles
			const descendantArticleIds = await getDescendantArticleIds(catalog, articleRefFilter);

			// Intersection between accessible articles and filtered articles
			descendantArticleIds.forEach((id) => {
				if (accessibleRefPaths.has(id)) articleRefPaths.add(id);
			});
		} else {
			articleRefPaths = accessibleRefPaths;
		}

		const modPropertyFilter = getCatalogPropertyFilter(catalog, propertyFilter);
		return await getSearchData(query, articleRefPaths, undefined, modPropertyFilter);
	},

	params(ctx, q, body, signal) {
		const query = q.query;
		const catalogName = q.catalogName;
		const type = isSearcherType(q.type) ? q.type : undefined;
		const propertyFilter = body?.propertyFilter;
		const resourceFilter = body?.resourceFilter;
		const articleRefFilter = body?.articleRefFilter;
		const articlesLanguage = isArticleLanguage(q.articlesLanguage) ? q.articlesLanguage : undefined;
		const catalogNames = body?.catalogNames;
		return {
			ctx,
			signal,
			catalogName,
			articleRefFilter,
			type,
			query,
			propertyFilter,
			resourceFilter,
			articlesLanguage,
			catalogNames,
		};
	},
});

export default searchCommand;
