import type Context from "@core/Context/Context";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import RuleProvider from "@ext/rules/RuleProvider";

export const getAccessibleArticleIds = async (ctx: Context, catalog: Catalog, requireExactLanguageMatch = false) => {
	const filters = new RuleProvider(ctx).getItemFilters({ requireExactLanguageMatch });
	const articles = catalog?.getItems(filters) ?? [];
	return articles.map((a) => a.ref.path.value);
};
