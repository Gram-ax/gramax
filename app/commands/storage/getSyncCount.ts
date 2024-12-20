import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { SilentMiddleware } from "@core/Api/middleware/SilentMiddleware";
import type Context from "@core/Context/Context";
import { Command } from "../../types/Command";

const getSyncCount: Command<
	{ ctx: Context; catalogName: string },
	{ pull?: number; push?: number; hasChanges?: boolean; errorMessage?: string }
> = Command.create({
	path: "storage/getSyncCount",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new SilentMiddleware()],

	async do({ catalogName }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		const storage = catalog?.repo.storage;
		if (!storage) return;
		return await storage.getSyncCount();
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName };
	},
});

export default getSyncCount;
