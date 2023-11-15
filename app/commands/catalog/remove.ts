import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import { Command } from "../../types/Command";

const remove: Command<{ catalogName: string }, void> = Command.create({
	path: "catalog/remove",

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ catalogName }) {
		await this._app.lib.removeCatalog(catalogName);
	},

	params(_, q) {
		return { catalogName: q.catalogName };
	},
});

export default remove;
