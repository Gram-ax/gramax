import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { Command } from "../../types/Command";

const updateProps: Command<{ ctx: Context; catalogName: string; props: ClientArticleProps }, { pathname: string }> =
	Command.create({
		path: "item/updateProps",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ ctx, catalogName, props }) {
			const { wm, resourceUpdaterFactory } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);
			if (!catalog) return;
			const updatedItem = await catalog.updateItemProps(props, resourceUpdaterFactory);

			const ref = { path: updatedItem.ref.path.value, storageId: updatedItem.ref.storageId };
			return { pathname: await catalog.getPathname(updatedItem), ref };
		},

		params(ctx, q, body) {
			const catalogName = q.catalogName;
			const props = body;
			return { ctx, catalogName, props };
		},
	});

export default updateProps;
