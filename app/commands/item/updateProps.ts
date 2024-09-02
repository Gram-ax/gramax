import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { Command } from "../../types/Command";

const updateProps: Command<{ ctx: Context; catalogName: string; props: ClientArticleProps }, string> = Command.create({
	path: "item/updateProps",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, props }) {
		const { wm, resourceUpdaterFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName);
		const newItem = await catalog.updateItemProps(props, resourceUpdaterFactory.withContext(ctx));

		return await catalog.getPathname(newItem);
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const props = body;
		return { ctx, catalogName, props };
	},
});

export default updateProps;
