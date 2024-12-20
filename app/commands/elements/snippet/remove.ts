import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";

const remove: Command<{ catalogName: string; snippetId: string; ctx: Context }, void> = Command.create({
	path: "elements/snippet/remove",

	kind: ResponseKind.none,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, snippetId, ctx }) {
		const { wm, sitePresenterFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;
		const sp = sitePresenterFactory.fromContext(ctx);
		return catalog.snippetProvider.remove(snippetId, sp);
	},

	params(ctx, q) {
		return { catalogName: q.catalogName, snippetId: q.snippetId, ctx };
	},
});

export default remove;
