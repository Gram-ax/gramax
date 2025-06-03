import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import { SnippetRenderData } from "@ext/markdown/elements/snippet/edit/model/types";

const getRenderData: Command<{ ctx: Context; snippetId: string; catalogName: string }, SnippetRenderData> =
	Command.create({
		path: "elements/snippet/getRenderData",

		kind: ResponseKind.json,

		middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ ctx, snippetId, catalogName }) {
			const { wm, parserContextFactory } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);
			if (!catalog) return;

			const snippet = catalog.customProviders.snippetProvider.getArticle(snippetId);
			if (!snippet) return;

			const context = await parserContextFactory.fromArticle(
				snippet,
				catalog,
				convertContentToUiLanguage(ctx.contentLanguage || catalog?.props?.language),
				ctx.user?.isLogged,
			);

			return catalog.customProviders.snippetProvider.getRenderData(snippetId, context);
		},

		params(ctx, q) {
			const snippetId = q.snippetId;
			const catalogName = q.catalogName;
			return { ctx, snippetId, catalogName };
		},
	});

export default getRenderData;
