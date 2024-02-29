import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import { SilentMiddleware } from "@core/Api/middleware/SilentMiddleware";
import Context from "@core/Context/Context";
import { Command, ResponseKind } from "../../types/Command";

const fetchCmd: Command<{ ctx: Context; catalogName: string }, void> = Command.create({
	path: "storage/fetch",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware(), new SilentMiddleware()],

	async do({ ctx, catalogName }) {
		const { lib, logger, rp } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const storage = catalog?.repo.storage;
		if (!storage) return;
		const data = rp.getSourceData(ctx.cookie, await storage.getSourceName());
		if (!data) return;
		await storage.fetch(data);

		logger.logTrace(`Fetched in catalog "${catalogName}".`);
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName };
	},
});

export default fetchCmd;
