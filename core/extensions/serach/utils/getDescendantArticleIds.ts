import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type { Catalog, ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import type { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import RuleProvider from "@ext/rules/RuleProvider";

export const getDescendantAccessibleArticleIds = async (ctx: Context, catalog: Catalog, articleRefPath: string) => {
	const filters = new RuleProvider(ctx).getItemFilters();
	return await getDescendantArticleIds(catalog, articleRefPath, filters);
};

export const getDescendantArticleIds = async (catalog: Catalog, articleRefPath: string, filters: ItemFilter[] = []) => {
	const root = catalog.findItemByItemPath(new Path(articleRefPath));
	const res = [];
	if (!root) return res;

	if (filters.every((filter) => filter(root, catalog))) res.push(articleRefPath);

	if (root.type === ItemType.category) {
		const items = catalog.getItems(filters, root as Category);
		res.push(...items.map((item) => item.ref.path.value));
	}

	return res;
};
