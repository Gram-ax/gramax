import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";

const clearArticlesContentWithSnippet: Command<{ catalogName: string; snippetId: string; ctx: Context }, void> =
	Command.create({
		path: "elements/snippet/clearArticlesContent",

		kind: ResponseKind.json,

		middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ catalogName, snippetId, ctx }) {
			const { wm, sitePresenterFactory } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);
			if (!catalog) return;
			const sp = sitePresenterFactory.fromContext(ctx);

			await sp.parseAllItems(catalog);
			await catalog.customProviders.snippetProvider.clearArticlesContentWithSnippet(snippetId);
		},

		params(ctx, q) {
			return { catalogName: q.catalogName, snippetId: q.snippetId, ctx };
		},
	});

export default clearArticlesContentWithSnippet;
