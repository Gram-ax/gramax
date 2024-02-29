import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import Context from "@core/Context/Context";
import { ItemRef } from "@core/FileStructue/Item/Item";
import RuleProvider from "@ext/rules/RuleProvider";
import { SearchItem } from "@ext/search/Searcher";
import { Command, ResponseKind } from "../../types/Command";

const search: Command<{ ctx: Context; query: string; catalogName?: string }, SearchItem[]> = Command.create({
	path: "search",

	kind: ResponseKind.json,

	async do({ ctx, query, catalogName }) {
		const { lib, errorArticlesProvider, searcher } = this._app;
		const filters = new RuleProvider(ctx, errorArticlesProvider).getItemFilters();

		const getCatalogItemRefs = async (catalogName: string): Promise<ItemRef[]> => {
			const catalog = await lib.getCatalog(catalogName);
			return catalog
				?.getContentItems()
				.filter((a) => filters.every((f) => f(a, catalog)))
				.map((a) => a.ref);
		};

		const getSearchData = async (query: string, catalogName: string) => {
			const search = async (query: string): Promise<SearchItem[]> => {
				const result = await searcher.search(query, catalogName, await getCatalogItemRefs(catalogName));
				return result.length > 0 ? result : null;
			};

			return (await multiLayoutSearcher<SearchItem[]>(search)(query)) ?? [];
		};

		const getAllSearchData = async (query: string) => {
			const catalogs = Array.from(lib.getCatalogEntries().values()).map((l) => l.getName());
			const catalogsItemRefs = {};
			await Promise.all(catalogs.map(async (c) => (catalogsItemRefs[c] = await getCatalogItemRefs(c))));

			const search = async (query: string): Promise<SearchItem[]> => {
				const result = await searcher.searchAll(query, catalogsItemRefs);
				return result.length > 0 ? result : null;
			};

			return (await multiLayoutSearcher<SearchItem[]>(search)(query)) ?? [];
		};

		return catalogName ? await getSearchData(query, catalogName) : await getAllSearchData(query);
	},

	params(ctx, q) {
		const query = q.query;
		const catalogName = q.catalogName;

		return { ctx, query, catalogName };
	},
});

export default search;
