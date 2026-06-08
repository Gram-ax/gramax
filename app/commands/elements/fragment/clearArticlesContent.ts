import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";

const clearArticlesContentWithFragment: Command<{ catalogName: string; fragmentId: string; ctx: Context }, void> =
	Command.create({
		path: "elements/fragment/clearArticlesContent",

		kind: ResponseKind.json,

		middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ catalogName, fragmentId, ctx }) {
			const { wm, sitePresenterFactory } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);
			if (!catalog) return;
			const sp = sitePresenterFactory.fromContext(ctx);

			await sp.parseAllItems(catalog);
			await catalog.customProviders.fragmentProvider.clearArticlesContentWithFragment(fragmentId);
		},

		params(ctx, q) {
			return { catalogName: q.catalogName, fragmentId: q.fragmentId, ctx };
		},
	});

export default clearArticlesContentWithFragment;
