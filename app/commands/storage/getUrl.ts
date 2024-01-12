import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { Command, ResponseKind } from "../../types/Command";

const getUrl: Command<{ catalogName: string }, string> = Command.create({
	path: "storage/getUrl",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const storage = catalog.repo.storage;
		if (!storage) return;
		return storage.getUrl();
	},

	params(_, q) {
		return { catalogName: q.catalogName };
	},
});

export default getUrl;
