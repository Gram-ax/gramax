import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import { Command, ResponseKind } from "../../../types/Command";

const checkout: Command<{ ctx: Context; catalogName: string; branch: string }, void> = Command.create({
	path: "versionControl/branch/checkout",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName, branch }) {
		const { lib, rp, logger } = this._app;

		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const source = rp.getSourceData(ctx.cookie, await catalog.repo.storage.getSourceName());
		await catalog.repo.checkout({
			data: source,
			branch,
			onCheckout: (branch) => logger.logInfo(`Checkout to "${branch}".`),
			onPull: () => logger.logInfo(`Pulled in "${catalogName}", branch: ${branch}.`),
		});
	},

	params(ctx, q) {
		const branch = q.branch;
		const catalogName = q.catalogName;
		return { ctx, branch, catalogName };
	},
});

export default checkout;
