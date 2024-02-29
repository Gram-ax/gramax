import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import { Command, ResponseKind } from "../../types/Command";

const haveToPull: Command<{ ctx: Context; catalogName: string }, boolean> = Command.create({
	path: "storage/haveToPull",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName }) {
		const { lib, logger, rp } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const storage = catalog?.repo.storage;
		if (!storage) return false;
		const data = rp.getSourceData(ctx.cookie, await storage.getSourceName());
		return catalog.repo.haveToPull({
			data,
			onFetch: () => logger.logTrace(`Fetched in catalog "${catalogName}".`),
		});
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName };
	},
});

export default haveToPull;
