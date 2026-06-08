import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import type { FragmentRenderData } from "@ext/markdown/elements/fragment/edit/model/types";

const getRenderData: Command<{ ctx: Context; fragmentId: string; catalogName: string }, FragmentRenderData | null> =
	Command.create({
		path: "elements/fragment/getRenderData",

		kind: ResponseKind.json,

		middlewares: [new ReloadConfirmMiddleware()],

		async do({ ctx, fragmentId, catalogName }) {
			const { wm, parserContextFactory } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);
			if (!catalog) return null;

			const fragment = catalog.customProviders.fragmentProvider.getArticle(fragmentId);
			if (!fragment) return null;

			const context = await parserContextFactory.fromArticle(
				fragment,
				catalog,
				convertContentToUiLanguage(ctx.contentLanguage || catalog?.props?.language),
			);

			return catalog.customProviders.fragmentProvider.getRenderData(fragmentId, context);
		},

		params(ctx, q) {
			const fragmentId = q.fragmentId;
			const catalogName = q.catalogName;
			return { ctx, fragmentId, catalogName };
		},
	});

export default getRenderData;
