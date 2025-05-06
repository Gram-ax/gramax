import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import ArticleProvider, { ArticleProviderType } from "@core/FileStructue/Article/ArticleProvider";

const remove: Command<{ ctx: Context; catalogName: string; id: string; type: ArticleProviderType }, void> =
	Command.create({
		path: "article/provider/remove",

		middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

		kind: ResponseKind.none,

		async do({ ctx, catalogName, id, type }) {
			const { wm, sitePresenterFactory } = this._app;
			const workspace = wm.current();
			const catalog = await workspace.getCatalog(catalogName, ctx);
			if (!catalog) return;

			const provider = ArticleProvider.getProvider(catalog, type);
			const sp = sitePresenterFactory.fromContext(ctx);
			await sp.parseAllItems(catalog);

			await provider.remove(id);
		},

		params(ctx, q) {
			const id = q.id;
			const type = q.type as ArticleProviderType;
			return { ctx, catalogName: q.catalogName, id, type };
		},
	});

export default remove;
