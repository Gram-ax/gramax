import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import { Category } from "@core/FileStructue/Category/Category";
import { Item } from "@core/FileStructue/Item/Item";
import Path from "../../../../logic/FileProvider/Path/Path";
import LinkItem from "../models/LinkItem";

class LinkItemCreator {
	constructor(private _catalog: Catalog) {}

	async getLinkItems(articlePath: Path): Promise<LinkItem[]> {
		if (!this._catalog) return [];
		const items = this._catalog.getItems();
		const itemsTree = this._catalog.getRootCategory().items;
		return Promise.all(items.map((i) => this._toItemLink(this._catalog, i, itemsTree, articlePath)));
	}

	private async _toItemLink(catalog: Catalog, item: Item, itemsTree: Item[], articlePath: Path): Promise<LinkItem> {
		return {
			type: item.type,
			title: item.getTitle() ?? "",
			pathname: `/${await catalog.getPathname(item)}`,
			breadcrumb: this._getBreadcrumb(itemsTree, [], item.logicPath) ?? [],
			relativePath: articlePath.getRelativePath(item.ref.path).value,
		};
	}

	private _getBreadcrumb(itemsTree: Item[], categoties: Category[], url: string) {
		for (const i of itemsTree) {
			if (url.includes(i.logicPath)) {
				if (!(i as Category)?.items || url === i.logicPath) {
					return categoties.map((c) => c.getTitle());
				} else return this._getBreadcrumb((i as Category).items, [...categoties, i as Category], url);
			}
		}
	}
}

export default LinkItemCreator;
