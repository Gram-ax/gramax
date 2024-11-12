import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { NetworkConnectMiddleWare } from "@core/Api/middleware/NetworkConntectMiddleware";
import { SilentMiddleware } from "@core/Api/middleware/SilentMiddleware";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";

const fetchCmd: Command<{ ctx: Context; catalogName: string }, void> = Command.create({
	path: "storage/fetch",

	kind: ResponseKind.none,

	middlewares: [new SilentMiddleware(), new NetworkConnectMiddleWare(), new AuthorizeMiddleware()],

	async do({ ctx, catalogName }) {
		const { logger, rp, wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName);

		const storage = catalog?.repo.storage;
		if (!storage) return;
		const data = rp.getSourceData(ctx.cookie, await storage.getSourceName());
		if (!data) return;
		await storage.fetch(data, catalog.repo.isBare);

		logger.logTrace(`Fetched in catalog "${catalogName}".`);
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName };
	},
});

export default fetchCmd;
