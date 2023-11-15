import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import { CatalogErrors } from "@core/FileStructue/Catalog/Catalog";
import Healthcheck from "../../../core/extensions/healthcheck/logic/Healthcheck";
import { Command, ResponseKind } from "../../types/Command";

const healthcheck: Command<{ ctx: Context; catalogName: string }, CatalogErrors> = Command.create({
	path: "healthcheck",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName }) {
		const { lib, sitePresenterFactory, conf, parserContextFactory } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProviderByCatalog(catalog);

		if (!catalog) return;

		const healthcheck = new Healthcheck(fp, conf.isServerApp, ctx.user?.isLogged, ctx.lang, parserContextFactory);
		const errors = await healthcheck.getLinkChecks(
			await sitePresenterFactory.fromContext(ctx).parseAllItems(catalog),
		);

		const catalogErrors = catalog.getErrors();
		Object.keys(catalogErrors).forEach((key) => {
			if (!errors[key]) errors[key] = [];
			errors[key].push(catalogErrors[key]);
		});

		return errors;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default healthcheck;
