import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import RuleProvider from "@ext/rules/RuleProvider";
import { getAccessibleCatalogs } from "@ext/security/logic/getAccessibleCatalogs";
import SecurityRules from "@ext/security/logic/SecurityRules";
import { type ArticleLanguage, isArticleLanguage } from "@ext/serach/modulith/SearchArticle";
import type { PropertyFilter, ResourceFilter, SearchResult } from "@ext/serach/Searcher";
import { isSearcherType, type SearcherType } from "@ext/serach/SearcherManager";
import { getCatalogPropertyFilter } from "@ext/serach/utils/getCatalogPropertyFilter";
import { Command } from "../../types/Command";

const searchCommand: Command<
	{
		ctx: Context;
		signal?: AbortSignal;
		type?: SearcherType;
		catalogName?: string;
		articleRefPath?: string;
		query: string | undefined;
		propertyFilter?: PropertyFilter;
		resourceFilter?: ResourceFilter;
		articlesLanguage?: ArticleLanguage;
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
		articleRefPath,
		propertyFilter,
		resourceFilter,
		articlesLanguage,
	}) {
		const getCatalogItemsIds = async (catalog: Catalog, requireExactLanguageMatch = false) => {
			const filters = new RuleProvider(ctx).getItemFilters({ requireExactLanguageMatch });
			const articles = catalog?.getItems(filters) ?? [];
			return articles.map((a) => a.ref.path.value);
		};

		const getSearchData = async (
			query: string | undefined,
			articleRefPaths: Set<string>,
			modPropertyFilter?: PropertyFilter,
		) => {
			const search = async (query: string) => {
				const result = await this._app.searcherManager.getSearcher(type).search({
					query,
					articleRefPaths,
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

		const getDescendantArticleIds = async (catalog: Catalog, articleRefPath: string) => {
			const root = catalog.findItemByItemPath(new Path(articleRefPath));
			if (!root) return [];

			if (root.type === ItemType.category) {
				const items = catalog.getItems([], root as Category);
				return [articleRefPath, ...items.map((item) => item.ref.path.value)];
			}

			return [articleRefPath];
		};

		if (!catalogName) {
			const catalogs = getAccessibleCatalogs(ctx.user, this._app.wm.current().getAllCatalogs().values());
			if (catalogs.length === 0) return [];
			const articleRefPaths = new Set<string>();
			await catalogs.forEachAsync(async (c) => {
				const catalog = await this._app.wm.current().getContextlessCatalog(c.name);
				(await getCatalogItemsIds(catalog)).forEach((id) => articleRefPaths.add(id));
			});

			return await getSearchData(query, articleRefPaths);
		}

		const catalog = await this._app.wm.current().getContextlessCatalog(catalogName);
		if (!catalog || !SecurityRules.canReadCatalog(ctx.user, catalog.perms, catalog.name)) return [];
		const realCatalog = await this._app.wm.current().getContextlessCatalog(BaseCatalog.parseName(catalogName).name);
		const accessibleRefPaths = new Set(await getCatalogItemsIds(realCatalog, true));
		let articleRefPaths = new Set<string>();
		if (articleRefPath) {
			// If there is an articleRefPath, then we filter only this article and its descendant articles
			const descendantArticleIds = await getDescendantArticleIds(catalog, articleRefPath);

			// Intersection between accessible articles and filtered articles
			descendantArticleIds.forEach((id) => {
				if (accessibleRefPaths.has(id)) articleRefPaths.add(id);
			});
		} else {
			articleRefPaths = accessibleRefPaths;
		}

		const modPropertyFilter = getCatalogPropertyFilter(catalog, propertyFilter);
		return await getSearchData(query, articleRefPaths, modPropertyFilter);
	},

	params(ctx, q, body, signal) {
		const query = q.query;
		const catalogName = q.catalogName;
		const type = isSearcherType(q.type) ? q.type : undefined;
		const propertyFilter = body?.propertyFilter;
		const resourceFilter = body?.resourceFilter;
		const articleRefPath = body?.articleRefPath;
		const articlesLanguage = isArticleLanguage(q.articlesLanguage) ? q.articlesLanguage : undefined;
		return {
			ctx,
			signal,
			catalogName,
			articleRefPath,
			type,
			query,
			propertyFilter,
			resourceFilter,
			articlesLanguage,
		};
	},
});

export default searchCommand;
