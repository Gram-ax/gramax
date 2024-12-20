import type Context from "@core/Context/Context";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { Category } from "@core/FileStructue/Category/Category";
import { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import RuleProvider from "@ext/rules/RuleProvider";
import Path from "../../../../logic/FileProvider/Path/Path";

class LinkItemCreator {
	constructor(private _ctx: Context, private _catalog: ReadonlyCatalog) {}

	async getLinkItems(articlePath: Path) {
		if (!this._catalog) return [];
		const filters = new RuleProvider(this._ctx).getItemFilters();
		const root = resolveRootCategory(this._catalog, this._catalog.props, this._ctx.contentLanguage);

		const getAllItems = (item: Item) => {
			const items = [item];
			if (item.type === ItemType.category) {
				(item as Category).items.forEach((subItem) => {
					items.push(...getAllItems(subItem));
				});
			}
			return items;
		};

		const items = getAllItems(root).slice(1);
		const itemTree = root.getFilteredItems(filters, this._catalog);

		return Promise.all(items.map((i) => this._toItemLink(i, itemTree, articlePath)));
	}

	private async _toItemLink(item: Item, itemsTree: Item[], articlePath: Path) {
		return {
			type: item.type,
			title: item.getTitle() ?? "",
			pathname: `/${await this._catalog.getPathname(item)}`,
			breadcrumb: this._getBreadcrumb(itemsTree, [], item.logicPath) ?? [],
			relativePath: articlePath.getRelativePath(item.ref.path).value,
			isCurrent: articlePath.value === item.ref.path.value,
		};
	}

	private _getBreadcrumb(itemsTree: Item[], categories: Category[], url: string) {
		for (const i of itemsTree) {
			if (url.includes(i.logicPath)) {
				if (!(i as Category)?.items || url === i.logicPath) {
					return categories.map((c) => c.getTitle());
				} else return this._getBreadcrumb((i as Category).items, [...categories, i as Category], url);
			}
		}
	}
}

export default LinkItemCreator;
