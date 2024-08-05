import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";

import Healthcheck, { CatalogErrors } from "../../../core/extensions/healthcheck/logic/Healthcheck";
import { Command } from "../../types/Command";

const healthcheck: Command<{ ctx: Context; catalogName: string }, CatalogErrors> = Command.create({
	path: "healthcheck",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName }) {
		const { wm, sitePresenterFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName);
		const fp = workspace.getFileProvider();

		if (!catalog) return;

		const healthcheck = new Healthcheck(
			fp,
			ctx,
			await sitePresenterFactory.fromContext(ctx).parseAllItems(catalog),
		);

		const errors = await healthcheck.checkCatalog();

		const catalogErrors = catalog.errors;
		Object.keys(catalogErrors).forEach((key) => {
			if (!errors[key]) errors[key] = [];
			errors[key].push(...catalogErrors[key]);
		});

		return errors;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default healthcheck;
