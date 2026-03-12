import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import type CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps";
import { Command } from "../../types/Command";

const create: Command<{ props: CatalogEditProps; ctx: Context }, ClientCatalogProps> = Command.create({
	path: "catalog/create",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ props, ctx }) {
		const { wm, sitePresenterFactory } = this._app;
		const workspace = await wm.currentOrDefault();

		const hasSiblingCatalog = workspace
			.getAllCatalogs()
			.keys()
			.some((name) => name.toLowerCase() === props.url.toLowerCase());

		if (hasSiblingCatalog) return;
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
