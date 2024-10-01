import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { NetworkConnectMiddleWare } from "@core/Api/middleware/NetworkConntectMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import { Command } from "../../types/Command";

const removeCloneCatalog: Command<{ catalogName: string }, void> = Command.create({
	path: "storage/removeCloneCatalog",

	middlewares: [new NetworkConnectMiddleWare(), new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName }) {
		await this._app.wm.current().removeCatalog(catalogName, false);
	},

	params(_, q) {
		return { catalogName: q.catalogName };
	},
});

export default removeCloneCatalog;
