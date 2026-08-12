import type FileProvider from "@core/FileProvider/model/FileProvider";
import type Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type { Category } from "@core/FileStructue/Category/Category";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type { MakeResourceUpdater } from "@core/Resource/ResourceUpdaterFactory";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { addEvent, Level, trace, traced } from "@ext/loggers/opentelemetry";
import type { NodeModel } from "@minoru/react-dnd-treeview";
import assert from "assert";
import type { Catalog } from "../../../../../logic/FileStructue/Catalog/Catalog";
import itemRefUtils from "../../../../../logic/utils/itemRefUtils";
import type { ItemLink } from "../../../NavigationLinks";
import DragTreeTransformer from "./DragTreeTransformer";
import { findMovement } from "./Movement/getMovements";

class DragTree {
	constructor(
		private _fp: FileProvider,
		private _makeResourceUpdater: MakeResourceUpdater,
		private _rootCategoryRef?: ItemRef,
	) {}

	@trace({ level: Level.Internal, omitArgs: true })
	public async findOrderingAncestors(newNav: NodeModel<ItemLink>[], draggedItemPath: string, catalog: Catalog) {
		let newCategoryPath: Path;
		const items = [DragTreeTransformer.getRootItem(), ...newNav];

		const draggedNodeIndex = items.findIndex((item) => item.data?.ref.path === draggedItemPath);
		if (draggedNodeIndex === -1) return;

		const draggedNode = items[draggedNodeIndex];
		const draggedItem = catalog.findItemByItemRef(this._getItemRef(draggedNode, catalog));
		const parentNode = items.find((item) => item.id === draggedNode.parent);
		if (!parentNode) return;

		const parent = catalog.findItemByItemRef<Category>(this._getItemRef(parentNode, catalog));

		const itemsWithSameParent = items.filter((i) => i.parent === draggedNode.parent);
		const prevNode =
			itemsWithSameParent[itemsWithSameParent.findIndex((i) => i.data?.ref.path === draggedItemPath) - 1];
		const prevItem = prevNode && catalog.findItemByItemRef(this._getItemRef(prevNode, catalog));

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

	@trace({ level: Level.Internal, omitArgs: true })
	public async drag(
		oldLevNav: NodeModel<ItemLink>[],
		newLevNav: NodeModel<ItemLink>[],
		draggedItemPath: string,
		catalog: Catalog,
		parseAllItems: (catalog: Catalog) => Promise<Catalog>,
		parentArticle?: Article,
		newCategoryPath?: Path,
	) {
		const currentItem = oldLevNav.find((a) => a.data.isCurrentLink);
		const logicPath = currentItem && RouterPathProvider.getLogicPath(currentItem.data.pathname);
		const rootItem = DragTreeTransformer.getRootItem();

		await parseAllItems(catalog);

		const movement = traced("getMovements", { level: Level.Internal }, () => {
			return findMovement<ItemLink>(
				[rootItem, ...oldLevNav],
				[rootItem, ...newLevNav],
				(moveItem) => moveItem.data?.ref.path === draggedItemPath,
			);
		});
		if (!movement) return "";
		const movements = [movement];
		const innerRefs = movements.map((movement) => itemRefUtils.parseRef(movement.moveItem.data.ref));
		let draggedItemRef: { oldLogicPath: string; newItemRef: ItemRef };

		catalog.repo?.pauseGitStaging();

		try {
			if (parentArticle)
				await catalog.createCategoryByArticle(this._makeResourceUpdater, parentArticle, newCategoryPath);

			for (const movement of movements) {
				const { moveItem, newList, oldList } = movement;
				const newParentItem = newList[newList.length - 2];
				const oldParentItem = oldList[oldList.length - 2];
				if (oldParentItem.id === newParentItem.id) continue;

				const moveItemRef = this._getItemRef(moveItem, catalog);
				const item = catalog.findItemByItemRef(moveItemRef);
				assert(item, `Navigation item '${moveItemRef.path.value}' wasn't found in catalog`);

				const newParentItemRef = this._getItemRef(newParentItem, catalog);
				const newWebsRef = catalog.findCategoryByItemRef(newParentItemRef)?.items?.map((i) => i.ref) ?? [];
				const newItemRef = itemRefUtils.move(newParentItemRef, moveItemRef, item.type, newWebsRef);

				if (currentItem && `${logicPath}/`.startsWith(`${item.logicPath}/`))
					draggedItemRef = { oldLogicPath: item.logicPath, newItemRef };

				addEvent("move", Level.Internal, {
					currentItemNotNull: !!currentItem,
					itemLogicPath: `${logicPath}/`.startsWith(`${item.logicPath}/`),
					draggedItemRefOld: draggedItemRef?.oldLogicPath,
					draggedItemRefNew: draggedItemRef?.newItemRef.path.value,
				});

				await catalog.moveItem(moveItemRef, newItemRef, this._makeResourceUpdater, innerRefs);
			}

			await this._fp.deleteEmptyDirs(catalog.getRootCategoryDirectoryPath());
		} finally {
			await catalog.repo?.resumeGitStaging();
		}

		if (draggedItemRef)
			return logicPath.replace(
				draggedItemRef.oldLogicPath,
				catalog.findItemByItemRef(draggedItemRef.newItemRef).logicPath,
			);

		return logicPath;
	}

	// The synthetic ROOT node (id === 0) must resolve to the category the nav
	// tree is actually rooted on. For a secondary language that is the language
	// category (catalog/<lang>), not the true catalog root — otherwise dragging
	// to the top level drops the /<lang>/ segment (#192). Falls back to the true
	// root when no language root is provided (primary language / single-language).
	private _getItemRef = (item: NodeModel<ItemLink>, catalog: Catalog) =>
		item.id ? itemRefUtils.parseRef(item.data.ref) : (this._rootCategoryRef ?? catalog.getRootCategoryRef());
}

export default DragTree;
