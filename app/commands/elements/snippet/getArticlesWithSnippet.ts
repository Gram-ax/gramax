import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";

const getArticlesWithSnippet: Command<
	{ catalogName: string; snippetId: string; ctx: Context },
	{ pathname: string; title: string }[]
> = Command.create({
	path: "elements/snippet/getArticlesWithSnippet",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, snippetId, ctx }) {
		const { wm, sitePresenterFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;
		const sp = sitePresenterFactory.fromContext(ctx);
		const items = await catalog.snippetProvider.getArticlesWithSnippet(snippetId, sp);
		return Promise.all(
			items.map(async (i) => ({
				pathname: await catalog.getPathname(i),
				title: i.getTitle(),
			})),
		);
	},

	params(ctx, q) {
		return { catalogName: q.catalogName, snippetId: q.snippetId, ctx };
	},
});

export default getArticlesWithSnippet;
