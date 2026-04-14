import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import type Context from "@core/Context/Context";
import type { Article } from "@core/FileStructue/Article/Article";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import Healthcheck, { type CatalogErrors } from "../../../core/extensions/healthcheck/logic/Healthcheck";
import { Command } from "../../types/Command";

const healthcheck: Command<{ ctx: Context; catalogName: string }, CatalogErrors> = Command.create({
	path: "healthcheck",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName }) {
		const { wm, sitePresenterFactory, parserContextFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		const fp = workspace.getFileProvider();

		if (!catalog) return;

		await sitePresenterFactory.fromContext(ctx).parseAllItems(catalog);

		const commentProvider = catalog.customProviders.commentProvider;
		const articles = catalog.getContentItems();

		const getParserContextFromArticle = (article: Article) =>
			parserContextFactory.fromArticle(
				article,
				catalog,
				convertContentToUiLanguage(ctx.contentLanguage || catalog?.props?.language),
			);

		await commentProvider.parseCatalogComments(articles, getParserContextFromArticle);

		const healthcheck = new Healthcheck(fp, catalog);

		return await healthcheck.checkCatalog();
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default healthcheck;
