import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import DragTree from "@ext/navigation/catalog/drag/logic/DragTree";
import DragTreeTransformer from "@ext/navigation/catalog/drag/logic/DragTreeTransformer";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import { NodeModel } from "@minoru/react-dnd-treeview";
import { Command } from "../../types/Command";

const updateNavigation: Command<
	{
		ctx: Context;
		itemPath: string;
		catalogName: string;
		draggedItemPath: string;
		newLevNav: NodeModel<ItemLink>[];
		oldLevNav: NodeModel<ItemLink>[];
	},
	NodeModel<ItemLink>[]
> = Command.create({
	path: "catalog/updateNavigation",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, draggedItemPath, itemPath, catalogName, newLevNav, oldLevNav }) {
		const { wm, resourceUpdaterFactory, sitePresenterFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		const fp = workspace.getFileProvider();
		const sitePresenter = sitePresenterFactory.fromContext(ctx);
		const dragTree = new DragTree(fp, resourceUpdaterFactory.withContext(ctx));
		const ancestors = await dragTree.findOrderingAncestors(newLevNav, draggedItemPath, catalog);
		if (!ancestors) return;

		let newLogicPath: string;
		if (ancestors.parent.type !== ItemType.article) {
			const prev = ancestors.prev != ancestors.parent ? ancestors.prev : null;
			await ancestors.dragged.setOrderAfter(ancestors.parent, prev);
			newLogicPath = await dragTree.drag(
				oldLevNav,
				newLevNav,
				catalog,
				sitePresenter.parseAllItems.bind(sitePresenter),
			);
			await ancestors.parent.sortItems();
		} else {
			newLogicPath = await dragTree.drag(
				oldLevNav,
				newLevNav,
				catalog,
				sitePresenter.parseAllItems.bind(sitePresenter),
				ancestors.parent,
				ancestors.newCategoryPath,
			);
		}
		return DragTreeTransformer.getRenderDragNav(
			await sitePresenter.getCatalogNav(
				catalog,
				newLogicPath ? catalog.findArticle(newLogicPath, [])?.ref.path.value : itemPath,
			),
		);
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const itemPath = q.itemPath;
		const draggedItemPath = body.draggedItemPath;
		const data = body as { old: NodeModel<ItemLink>[]; new: NodeModel<ItemLink>[] };
		return { ctx, itemPath, draggedItemPath, catalogName, newLevNav: data.new, oldLevNav: data.old };
	},
});

export default updateNavigation;
