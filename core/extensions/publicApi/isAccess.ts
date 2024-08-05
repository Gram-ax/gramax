import Context from "@core/Context/Context";
import { Article } from "@core/FileStructue/Article/Article";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import RuleProvider from "@ext/rules/RuleProvider";

const isAccess = (context: Context, article: Article, catalog: Catalog) => {
	const filters = new RuleProvider(context).getItemFilters();
	return filters.every((f) => f(article, catalog));
};

export default isAccess;
