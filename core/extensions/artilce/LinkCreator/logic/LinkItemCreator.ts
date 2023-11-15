import Path from "../../../../logic/FileProvider/Path/Path";
import { Catalog } from "../../../../logic/FileStructue/Catalog/Catalog";
import { Category } from "../../../../logic/FileStructue/Category/Category";
import { Item } from "../../../../logic/FileStructue/Item/Item";
import LinkItem from "../models/LinkItem";

class LinkItemCreator {
	constructor(private _catalog: Catalog) {}

	getLinkItems(articlePath: Path): LinkItem[] {
		if (!this._catalog) return [];
		const items = this._catalog.getItems().filter((item) => !item.ref.path.compare(articlePath));
		const itemsTree = this._catalog.getRootCategory().items;
		return items.map((i) => this._toItemLink(this._catalog, i, itemsTree)).filter((i) => i);
	}

	private _toItemLink(catalog: Catalog, item: Item, itemsTree: Item[]): LinkItem {
		return {
			type: item.type,
			title: item.props.title?.toString() ?? "",
			logicPath: `/${item.logicPath}`,
			relativePath: `...${catalog.getRootCategoryPath().subDirectory(item.ref.path).value}`,
			breadcrumb: this._getBreadcrumb(itemsTree, [], item.logicPath) ?? [],
		};
	}

	private _getBreadcrumb(itemsTree: Item[], categoties: Category[], url: string) {
		for (const i of itemsTree) {
			if (url.includes(i.logicPath)) {
				if (!(i as Category)?.items || url === i.logicPath) {
					return categoties.map((c) => c.props.title);
				} else return this._getBreadcrumb((i as Category).items, [...categoties, i as Category], url);
			}
		}
	}
}

export default LinkItemCreator;
