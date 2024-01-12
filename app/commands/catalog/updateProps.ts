import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import { CatalogProps } from "@core/SitePresenter/SitePresenter";
import CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps.schema";
import { Command, ResponseKind } from "../../types/Command";

const updateProps: Command<{ ctx: Context; catalogName: string; props: CatalogEditProps }, CatalogProps> =
	Command.create({
		path: "catalog/updateProps",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

		async do({ ctx, catalogName, props }) {
			const { lib, sitePresenterFactory, rp } = this._app;
			const catalog = await lib.getCatalog(catalogName);
			if (!catalog) return;

			const newCatalog = await catalog.updateProps(rp, props);
			return sitePresenterFactory.fromContext(ctx).getCatalogProps(newCatalog);
		},

		params(ctx, q, body) {
			const catalogName = q.catalogName;
			const props = body as CatalogEditProps;
			return { ctx, props, catalogName };
		},
	});

export default updateProps;
