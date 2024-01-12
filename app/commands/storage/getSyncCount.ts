import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { SilentMiddleware } from "@core/Api/middleware/SilentMiddleware";
import { Command, ResponseKind } from "../../types/Command";

const getSyncCount: Command<{ catalogName: string }, { pull: number; push: number }> = Command.create({
	path: "storage/getSyncCount",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new SilentMiddleware()],

	async do({ catalogName }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const storage = catalog?.repo.storage;
		if (!storage) return;
		return storage.getSyncCount();
	},

	params(_, q) {
		return { catalogName: q.catalogName };
	},
});

export default getSyncCount;
