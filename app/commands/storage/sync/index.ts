import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import Context from "../../../../core/logic/Context/Context";
import { Command } from "../../../types/Command";

const sync: Command<{ ctx: Context; catalogName: string; recursive?: boolean }, void> = Command.create({
	path: "storage/sync",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, recursive }) {
		const { lib, rp, logger } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const storage = catalog.repo.storage;
		if (!storage) return;
		const sourceData = rp.getSourceData(ctx.cookie, await storage.getSourceName());
		await catalog.repo.sync({
			recursive,
			data: sourceData,
			onPull: () => logger.logTrace(`Pulled in catalog "${catalogName}".`),
			onPush: () => logger.logTrace(`Pushed in catalog "${catalogName}".`),
		});
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName, recursive: q.recursive === "true" };
	},
});

export default sync;
