import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps.schema";
import { Command, ResponseKind } from "../../types/Command";

const create: Command<{ props: CatalogEditProps; ctx: Context }, ClientCatalogProps> = Command.create({
	path: "catalog/create",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ props, ctx }) {
		const { lib, sitePresenterFactory } = this._app;

		if (Array.from(lib.getCatalogEntries().keys()).includes(props.url)) return;
		const fs = lib.getFileStructure();
		const catalog = await fs.createCatalog(props);
		if (!catalog) return null;

		await lib.addCatalog(catalog);
		return sitePresenterFactory.fromContext(ctx).serializeCatalogProps(catalog);
	},

	params(ctx, _, body) {
		const props = body as CatalogEditProps;
		return { ctx, props };
	},
});

export default create;
