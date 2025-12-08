import { ResponseKind } from "@app/types/ResponseKind";
import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import Context from "@core/Context/Context";
import RuleProvider from "@ext/rules/RuleProvider";
import { SearchResult } from "@ext/serach/Searcher";
import { isSearcherType, SearcherType } from "@ext/serach/SearcherManager";
import { Command } from "../../types/Command";
import { ArticleLanguage, isArticleLanguage } from "@ext/serach/modulith/SearchArticle";

const searchCommand: Command<
	{
		ctx: Context;
		type?: SearcherType;
		catalogName?: string;
		query: string | undefined;
		properties?: { key: string; value: unknown }[];
		articlesLanguage?: ArticleLanguage;
	},
	SearchResult[]
> = Command.create({
	path: "search/searchCommand",

	kind: ResponseKind.json,

	async do({ ctx, query, type, catalogName, properties, articlesLanguage }) {
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
					properties,
					articlesLanguage,
				});
				return result;
			};

			return (query ? await multiLayoutSearcher<SearchResult[]>(search)(query) : search(query)) ?? [];
		};

		const getAllSearchData = async (query: string | undefined) => {
			const catalogs = Array.from(this._app.wm.current().getAllCatalogs().keys());
			const catalogArticleIds = {};
			await Promise.all(catalogs.map(async (c) => (catalogArticleIds[c] = await getCatalogItemsIds(c))));
			const search = async (query: string) => {
				const result = await this._app.searcherManager.getSearcher(type).searchAll({
					query,
					catalogToArticleIds: catalogArticleIds,
					properties,
					articlesLanguage,
				});
				return result;
			};

			return (query ? await multiLayoutSearcher<SearchResult[]>(search)(query) : search(query)) ?? [];
		};

		return catalogName ? await getSearchData(query, catalogName) : await getAllSearchData(query);
	},

	params(ctx, q, body) {
		const query = q.query;
		const catalogName = q.catalogName;
		const type = isSearcherType(q.type) ? q.type : undefined;
		const properties = body?.properties;
		const articlesLanguage = isArticleLanguage(q.articlesLanguage) ? q.articlesLanguage : undefined;
		return { ctx, catalogName, type, query, properties, articlesLanguage };
	},
});

export default searchCommand;
