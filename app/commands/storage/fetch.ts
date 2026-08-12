import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { SilentMiddleware } from "@core/Api/middleware/SilentMiddleware";
import { getAutoPullSourceData } from "@core/AutoPull/AutoPull";
import type Context from "@core/Context/Context";
import { Command } from "../../types/Command";

const fetchCmd: Command<{ ctx: Context; catalogName: string }, void> = Command.create({
	path: "storage/fetch",

	kind: ResponseKind.none,

	middlewares: [new SilentMiddleware(), new AuthorizeMiddleware()],

	async do({ ctx, catalogName }) {
		const { rp, wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);

		const storage = catalog?.repo.storage;
		if (!storage) return;

		const sourceName = await storage.getSourceName();
		const data =
			rp.getSourceData(ctx, sourceName) ??
			(getExecutingEnvironment() === "next" ? getAutoPullSourceData(sourceName, await storage.getType()) : null);
		if (!data) return;

		await storage.fetch(data, catalog.repo.isBare, false);

		if (catalog.repo.isBare) {
			catalog.repo.gvc.update();
		}
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName };
	},
});

export default fetchCmd;
