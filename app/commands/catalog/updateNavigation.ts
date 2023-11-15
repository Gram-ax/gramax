import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import DragTree from "@ext/navigation/catalog/drag/logic/DragTree";
import DragTreeTransformer from "@ext/navigation/catalog/drag/logic/DragTreeTransformer";
import { NodeModel } from "@minoru/react-dnd-treeview";
import { Command, ResponseKind } from "../../types/Command";

const updateNavigation: Command<
	{
		ctx: Context;
		logicPath: string;
		catalogName: string;
		newLevNav: NodeModel<ItemLink>[];
		oldLevNav: NodeModel<ItemLink>[];
	},
	NodeModel<ItemLink>[]
> = Command.create({
	path: "catalog/updateNavigation",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ ctx, logicPath, catalogName, newLevNav, oldLevNav }) {
		const { formatter, lib, parser, parserContextFactory, sp, vcp, sitePresenterFactory } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProviderByCatalog(catalog);
		const ru = new ResourceUpdater(ctx, parser, parserContextFactory, formatter);
		const dragTree = new DragTree(fp, ru, sp, vcp);
		await dragTree.setOrders(newLevNav, catalog);
		await dragTree.drag(oldLevNav, newLevNav, catalog);
		return DragTreeTransformer.getRenderDragNav(
			await sitePresenterFactory.fromContext(ctx).getCatalogNav(catalog, logicPath),
		);
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const logicPath = q.logicPath;
		const data = body as { old: NodeModel<ItemLink>[]; new: NodeModel<ItemLink>[] };
		return { ctx, logicPath, catalogName, newLevNav: data.new, oldLevNav: data.old };
	},
});

export default updateNavigation;
