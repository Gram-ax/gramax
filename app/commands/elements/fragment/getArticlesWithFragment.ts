import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";

const getArticlesWithFragment: Command<
	{ catalogName: string; fragmentId: string; ctx: Context },
	{ pathname: string; title: string }[]
> = Command.create({
	path: "elements/fragment/getArticlesWithFragment",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, fragmentId, ctx }) {
		const { wm, sitePresenterFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;
		const sp = sitePresenterFactory.fromContext(ctx);

		await sp.parseAllItems(catalog);
		const items = await catalog.customProviders.fragmentProvider.getArticlesWithFragment(fragmentId);

		return Promise.all(
			items.map(async (i) => ({
				pathname: await catalog.getPathname(i),
				title: i.getTitle(),
			})),
		);
	},

	params(ctx, q) {
		return { catalogName: q.catalogName, fragmentId: q.fragmentId, ctx };
	},
});

export default getArticlesWithFragment;
