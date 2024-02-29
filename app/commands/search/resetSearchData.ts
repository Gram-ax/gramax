import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import { Command } from "../../types/Command";

const resetSearchData: Command<void, void> = Command.create({
	path: "search/resetSearchData",

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do() {
		await this._app.searcher.resetAllCatalogs();
	},

	params() {
		return;
	},
});

export default resetSearchData;
