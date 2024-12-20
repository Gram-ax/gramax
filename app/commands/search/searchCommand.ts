import { ResponseKind } from "@app/types/ResponseKind";
import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import Context from "@core/Context/Context";
import RuleProvider from "@ext/rules/RuleProvider";
import { SearchItem } from "@ext/serach/Searcher";
import { Command } from "../../types/Command";

const searchCommand: Command<{ ctx: Context; catalogName?: string; query: string }, SearchItem[]> = Command.create({
	path: "search/searchCommand",

	kind: ResponseKind.json,

	async do({ ctx, query, catalogName }) {
		const filters = new RuleProvider(ctx).getItemFilters();
		const getCatalogItemsIds = async (catalogName: string) => {
			const catalog = await this._app.wm.current().getCatalog(catalogName, ctx);
			const articles = catalog?.getItems() ?? [];
			return articles.filter((a) => filters.every((f) => f(a, catalog))).map((a) => a.ref.path.value);
		};

		const getSearchData = async (query: string, catalogName: string) => {
			const search = async (query: string) => {
				const result = await this._app.searcher.search(
					query,
					catalogName,
					await getCatalogItemsIds(catalogName),
				);
				return result.length > 0 ? result : null;
			};

			return (await multiLayoutSearcher<SearchItem[]>(search)(query)) ?? [];
		};

		const getAllSearchData = async (query: string) => {
			const catalogs = Array.from(this._app.wm.current().getAllCatalogs().keys());
			const catalogArticleIds = {};
			await Promise.all(catalogs.map(async (c) => (catalogArticleIds[c] = await getCatalogItemsIds(c))));
			const search = async (query: string) => {
				const result = await this._app.searcher.searchAll(query, catalogArticleIds);
				return result.length > 0 ? result : null;
			};

			return (await multiLayoutSearcher<SearchItem[]>(search)(query)) ?? [];
		};

		return catalogName ? await getSearchData(query, catalogName) : await getAllSearchData(query);
	},

	params(ctx, q) {
		const query = q.query;
		const catalogName = q.catalogName;
		return { ctx, catalogName, query };
	},
});

export default searchCommand;
