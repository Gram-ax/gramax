import { NodeModel } from "@minoru/react-dnd-treeview";
import hash from "object-hash";
import { CategoryLink, ItemLink } from "../../../NavigationLinks";
import { isDeepestArticle } from "@ext/artilce/actions/CreateArticle";

abstract class DragTreeTransformer {
	static getRootId() {
		return 0;
	}

	static getRenderDragNav(items: ItemLink[]): NodeModel<ItemLink>[] {
		const dragNavItems: NodeModel<ItemLink>[] = [];

		const func = (item: ItemLink, parentId?: number | string) => {
			dragNavItems.push(
				this.getDragNavItem(
					item,
					!!(item as CategoryLink).items?.length || !isDeepestArticle(item.ref.path),
					parentId,
				),
			);
			(item as CategoryLink).items?.forEach((i) => func(i, this._getNodeId(item)));
		};

		items.forEach((i) => func(i, this.getRootId()));

		return dragNavItems;
	}

	static getRootItem(): NodeModel<ItemLink> {
		return {
			id: this.getRootId(),
			text: "ROOT",
			droppable: false,
			parent: null,
		};
	}

	static getDragNavItem(item: ItemLink, droppable: boolean, parent?: number | string): NodeModel<ItemLink> {
		return {
			id: this._getNodeId(item),
			text: item.title,
			droppable: droppable,
			parent: parent ?? this.getRootId(),
			data: {
				ref: item.ref,
				type: item.type,
				icon: item.icon,
				query: item.query,
				title: item.title,
				external: item.external,
				pathname: item.pathname,
				isCurrentLink: item.isCurrentLink,
				items: (item as CategoryLink).items,
				isExpanded: (item as CategoryLink)?.isExpanded ?? false,
				existContent: (item as CategoryLink)?.existContent ?? false,
			} as any,
		};
	}

	static isModified(draggedItemPath: string, oldNav: NodeModel<ItemLink>[], newNav: NodeModel<ItemLink>[]) {
		const draggedNodeParent = oldNav.find((item) => item.data?.ref.path == draggedItemPath).parent;
		const newItemsWithSameParent = newNav.filter((i) => i.parent == draggedNodeParent);
		const oldItemsWithSameParent = oldNav.filter((i) => i.parent == draggedNodeParent);
		if (newItemsWithSameParent.length !== oldItemsWithSameParent.length) return true;
		return newItemsWithSameParent.some((item, i) => item.id !== oldItemsWithSameParent[i].id);
	}

	private static _getNodeId(item: ItemLink): number | string {
		return hash({ id: item.pathname + item.title });
	}
}

export default DragTreeTransformer;
