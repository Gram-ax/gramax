import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Command } from "../../../types/Command";

const checkout: Command<{ ctx: Context; catalogName: string; branch: string; articlePath: Path }, string> =
	Command.create({
		path: "versionControl/branch/checkout",

		kind: ResponseKind.plain,

		middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ ctx, catalogName, branch, articlePath }) {
			const { rp, logger, wm } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getContextlessCatalog(catalogName);
			if (!catalog) return;
			const source = rp.getSourceData(ctx, await catalog.repo.storage.getSourceName());
			await catalog.repo.checkout({
				data: source,
				branch,
				onCheckout: (branch) => logger.logInfo(`Checkout to "${branch}".`),
				onPull: () => logger.logInfo(`Pulled in "${catalogName}", branch: ${branch}.`),
			});

			const currentArticle = catalog.findItemByItemPath(articlePath);
			return await catalog.getPathname(currentArticle);
		},

		params(ctx, q) {
			const branch = q.branch;
			const catalogName = q.catalogName;
			const articlePath = new Path(q.articlePath);
			return { ctx, branch, catalogName, articlePath };
		},
	});

export default checkout;
