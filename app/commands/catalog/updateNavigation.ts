import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import DragTree from "@ext/navigation/catalog/drag/logic/DragTree";
import DragTreeTransformer from "@ext/navigation/catalog/drag/logic/DragTreeTransformer";
import { NodeModel } from "@minoru/react-dnd-treeview";
import { Command } from "../../types/Command";

const updateNavigation: Command<
	{
		ctx: Context;
		logicPath: string;
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

	async do({ ctx, draggedItemPath, logicPath, catalogName, newLevNav, oldLevNav }) {
		const { wm, resourceUpdaterFactory, sitePresenterFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName);
		const fp = workspace.getFileProvider();
		const sitePresenter = sitePresenterFactory.fromContext(ctx);
		const dragTree = new DragTree(fp, resourceUpdaterFactory.withContext(ctx));
		const ancestors = await dragTree.findOrderingAncestors(newLevNav, draggedItemPath, catalog);
		if (!ancestors) return;

		const prev = ancestors.prev != ancestors.parent ? ancestors.prev : null;
		await ancestors.dragged.setOrderAfter(ancestors.parent, prev);
		await dragTree.drag(oldLevNav, newLevNav, catalog, sitePresenter.parseAllItems.bind(sitePresenter));
		await ancestors.parent.sortItems();
		return DragTreeTransformer.getRenderDragNav(await sitePresenter.getCatalogNav(catalog, logicPath));
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const logicPath = q.logicPath;
		const draggedItemPath = body.draggedItemPath;
		const data = body as { old: NodeModel<ItemLink>[]; new: NodeModel<ItemLink>[] };
		return { ctx, logicPath, draggedItemPath, catalogName, newLevNav: data.new, oldLevNav: data.old };
	},
});

export default updateNavigation;
