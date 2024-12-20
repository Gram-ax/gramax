import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps.schema";
import { Command } from "../../types/Command";

const create: Command<{ props: CatalogEditProps; ctx: Context }, ClientCatalogProps> = Command.create({
	path: "catalog/create",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ props, ctx }) {
		const { wm, sitePresenterFactory } = this._app;
		const workspace = await wm.currentOrDefault();

		if (Array.from(workspace.getAllCatalogs().keys()).includes(props.url)) return;
		const fs = workspace.getFileStructure();
		const catalog = await fs.createCatalog(props);
		if (!catalog) return null;
		await workspace.addCatalog(catalog);
		await this._commands.article.create.do({ ctx, catalogName: catalog.name });
		return sitePresenterFactory.fromContext(ctx).serializeCatalogProps(catalog);
	},

	params(ctx, _, body) {
		const props = body as CatalogEditProps;
		return { ctx, props };
	},
});

export default create;
