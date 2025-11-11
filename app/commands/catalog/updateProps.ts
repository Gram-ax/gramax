import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps";
import { compareSyntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
import { Command } from "../../types/Command";

const updateProps: Command<{ ctx: Context; catalogName: string; props: CatalogEditProps }, ClientCatalogProps> =
	Command.create({
		path: "catalog/updateProps",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ ctx, catalogName, props }) {
			const { wm, sitePresenterFactory, resourceUpdaterFactory } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);
			if (!catalog) return;
			const isSyntaxChanged = props.syntax && !compareSyntax(catalog.props.syntax, props.syntax);
			const newCatalog = await catalog.updateProps(props, resourceUpdaterFactory);
			if (isSyntaxChanged) await this._commands.catalog.setSyntax.do({ ctx, catalogName });

			return sitePresenterFactory.fromContext(ctx).serializeCatalogProps(newCatalog);
		},

		params(ctx, q, body) {
			const catalogName = q.catalogName;
			const props = body as CatalogEditProps;
			return { ctx, props, catalogName };
		},
	});

export default updateProps;
