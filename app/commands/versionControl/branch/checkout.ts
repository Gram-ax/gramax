import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import { Command } from "../../../types/Command";

const checkout: Command<{ ctx: Context; catalogName: string; branch: string }, string> = Command.create({
	path: "versionControl/branch/checkout",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, branch }) {
		const { rp, logger, wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) return;
		const source = rp.getSourceData(ctx.cookie, await catalog.repo.storage.getSourceName());
		await catalog.repo.checkout({
			data: source,
			branch,
			onCheckout: (branch) => logger.logInfo(`Checkout to "${branch}".`),
			onPull: () => logger.logInfo(`Pulled in "${catalogName}", branch: ${branch}.`),
		});

		return await catalog.getPathname();
	},

	params(ctx, q) {
		const branch = q.branch;
		const catalogName = q.catalogName;
		return { ctx, branch, catalogName };
	},
});

export default checkout;
