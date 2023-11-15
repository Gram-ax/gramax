import FileProvider from "@core/FileProvider/model/FileProvider";
import { NodeModel } from "@minoru/react-dnd-treeview";
import { Catalog } from "../../../../../logic/FileStructue/Catalog/Catalog";
import ResourceUpdater from "../../../../../logic/Resource/ResourceUpdater";
import itemRefUtils from "../../../../../logic/utils/itemRefUtils";
import VersionControlProvider from "../../../../VersionControl/model/VersionControlProvider";
import StorageProvider from "../../../../storage/logic/StorageProvider";
import { ItemLink } from "../../../NavigationLinks";
import DragTreeTransformer from "./DragTreeTransformer";
import getMovements from "./Movement/getMovements";

class DragTree {
	constructor(
		private _fp: FileProvider,
		private _resourceUpdater: ResourceUpdater,
		private _sp: StorageProvider,
		private _vcp: VersionControlProvider,
	) {}

	public async drag(
		oldLevNav: NodeModel<ItemLink>[],
		newLevNav: NodeModel<ItemLink>[],
		catalog: Catalog,
	): Promise<NodeModel<ItemLink>[]> {
		const rootItem = DragTreeTransformer.getRootItem();
		const movements = getMovements<ItemLink>([rootItem, ...oldLevNav], [rootItem, ...newLevNav]);
		if (!movements.length) return newLevNav;
		for (const movement of movements) {
			const { moveItem, newList, oldList } = movement;
			const newParentItem = newList[newList.length - 2];
			const oldParentItem = oldList[oldList.length - 2];
			if (oldParentItem.id == newParentItem.id) continue;

			const moveItemRef = this._getItemRef(moveItem, catalog);
			const newParentItemRef = this._getItemRef(newParentItem, catalog);
			const newBrowsersRef = catalog.findCategoryByItemRef(newParentItemRef)?.items?.map((i) => i.ref) ?? [];

			const item = catalog.findItemByItemRef(moveItemRef);
			const newItemRef = itemRefUtils.move(newParentItemRef, moveItemRef, item.type, newBrowsersRef);
			await catalog.moveItem(moveItemRef, newItemRef, this._resourceUpdater);
		}
		await catalog.update(this._sp, this._vcp);
		await this._fp.deleteEmptyFolders(catalog.getRootCategoryRef().path.parentDirectoryPath);
	}

	public async setOrders(nav: NodeModel<ItemLink>[], catalog: Catalog) {
		const items = [DragTreeTransformer.getRootItem(), ...nav];
		const newGroupedItems: { [parentId: number | string]: NodeModel<ItemLink>[] } = {};

		items.forEach((item) => {
			if (!newGroupedItems[item.parent]) newGroupedItems[item.parent] = [item];
			else newGroupedItems[item.parent].push(item);
		});

		const parentIds = Object.keys(newGroupedItems);
		for (const parentId of parentIds) {
			const parentItem = items.find((item) => item.id == parentId);
			if (!parentItem) continue;

			const newCategoryItems = newGroupedItems[parentId];
			const newBrowsers = newCategoryItems.map((i) => catalog.findItemByItemRef(this._getItemRef(i, catalog)));

			const parentCategory = catalog.findCategoryByItemRef(this._getItemRef(parentItem, catalog));
			await parentCategory.sortItems(newBrowsers);
		}
	}

	private _getItemRef = (item: NodeModel<ItemLink>, catalog: Catalog) =>
		item.id ? itemRefUtils.parseRef(item.data.ref) : catalog.getRootCategoryRef();
}

export default DragTree;
