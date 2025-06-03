import FileProvider from "@core/FileProvider/model/FileProvider";
import { Article } from "@core/FileStructue/Article/Article";
import type { Category } from "@core/FileStructue/Category/Category";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type { MakeResourceUpdater } from "@core/Resource/ResourceUpdaterFactory";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { NodeModel } from "@minoru/react-dnd-treeview";
import { Catalog } from "../../../../../logic/FileStructue/Catalog/Catalog";
import itemRefUtils from "../../../../../logic/utils/itemRefUtils";
import { ItemLink } from "../../../NavigationLinks";
import DragTreeTransformer from "./DragTreeTransformer";
import getMovements from "./Movement/getMovements";
import Path from "@core/FileProvider/Path/Path";

class DragTree {
	constructor(private _fp: FileProvider, private _makeResourceUpdater: MakeResourceUpdater) {}

	public async findOrderingAncestors(newNav: NodeModel<ItemLink>[], draggedItemPath: string, catalog: Catalog) {
		let newCategoryPath: Path;
		const items = [DragTreeTransformer.getRootItem(), ...newNav];

		const draggedNodeIndex = items.findIndex((item) => item.data?.ref.path == draggedItemPath);
		if (draggedNodeIndex == -1) return;

		const draggedNode = items[draggedNodeIndex];
		const draggedItem = catalog.findItemByItemRef(this._getItemRef(draggedNode, catalog));

		const itemsWithSameParent = items.filter((i) => i.parent == draggedNode.parent);

		const prevNodeIndex =
			itemsWithSameParent[itemsWithSameParent.findIndex((i) => i.data?.ref.path == draggedItemPath) - 1];

		const prevItem = prevNodeIndex && catalog.findItemByItemRef(this._getItemRef(prevNodeIndex, catalog));

		const parentNodeIdx = prevItem && items.findIndex((i) => i.id == prevNodeIndex.parent);

		let parent: Category;
		if (typeof parentNodeIdx == "undefined" || parentNodeIdx == -1) {
			const ref = this._getItemRef(
				items.find((i) => i.id == draggedNode.parent),
				catalog,
			);
			parent = catalog.findItemByItemRef(ref);
		} else {
			parent = catalog.findItemByItemRef(this._getItemRef(items[parentNodeIdx], catalog));
		}

		if (!draggedItem || !parent) return;

		if (parent.type === ItemType.article)
			newCategoryPath = await this._getCategoryByArticle(catalog, parent, newNav);

		return {
			dragged: draggedItem,
			prev: prevItem,
			parent,
			newCategoryPath,
		};
	}

	private async _getCategoryByArticle(catalog: Catalog, parent: Category, newNav: NodeModel<ItemLink>[]) {
		const path = await catalog.categoryPathByArticle(parent);
		newNav.find((i) => i.data.ref.path === parent.ref.path.value).data.ref.path = path.value;
		return path;
	}

	public async drag(
		oldLevNav: NodeModel<ItemLink>[],
		newLevNav: NodeModel<ItemLink>[],
		catalog: Catalog,
		parseAllItems: (catalog: Catalog) => Promise<Catalog>,
		parentArticle?: Article,
		newCategoryPath?: Path,
	) {
		const logicPath = RouterPathProvider.getLogicPath(oldLevNav.find((a) => a.data.isCurrentLink).data.pathname);
		const rootItem = DragTreeTransformer.getRootItem();
		const movements = getMovements<ItemLink>([rootItem, ...oldLevNav], [rootItem, ...newLevNav]);
		if (!movements.length) return "";
		await parseAllItems(catalog);
		const innerRefs = movements.map((movement) => itemRefUtils.parseRef(movement.moveItem.data.ref));
		let draggedItemRef: { oldLogicPath: string; newItemRef: ItemRef };
		for (const movement of movements) {
			const { moveItem, newList, oldList } = movement;
			const newParentItem = newList[newList.length - 2];
			const oldParentItem = oldList[oldList.length - 2];
			if (oldParentItem.id == newParentItem.id) continue;

			const moveItemRef = this._getItemRef(moveItem, catalog);
			const item = catalog.findItemByItemRef(moveItemRef);

			const newParentItemRef = this._getItemRef(newParentItem, catalog);
			const newBrowsersRef = catalog.findCategoryByItemRef(newParentItemRef)?.items?.map((i) => i.ref) ?? [];
			const newItemRef = itemRefUtils.move(newParentItemRef, moveItemRef, item.type, newBrowsersRef);
			if (`${logicPath}/`.startsWith(`${item.logicPath}/`))
				draggedItemRef = { oldLogicPath: item.logicPath, newItemRef };

			await catalog.moveItem(moveItemRef, newItemRef, this._makeResourceUpdater, innerRefs);
		}
		await this._fp.deleteEmptyFolders(catalog.getRootCategoryRef().path.parentDirectoryPath);
		if (parentArticle)
			await catalog.createCategoryByArticle(this._makeResourceUpdater, parentArticle, newCategoryPath);
		await catalog.update();

		if (draggedItemRef)
			return logicPath.replace(
				draggedItemRef.oldLogicPath,
				catalog.findItemByItemRef(draggedItemRef.newItemRef).logicPath,
			);

		return logicPath;
	}

	private _getItemRef = (item: NodeModel<ItemLink>, catalog: Catalog) =>
		item.id ? itemRefUtils.parseRef(item.data.ref) : catalog.getRootCategoryRef();
}

export default DragTree;
