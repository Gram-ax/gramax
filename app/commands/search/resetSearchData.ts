import { Command } from "../../types/Command";

const resetSearchData: Command<void, void> = Command.create({
	path: "search/resetSearchData",

	async do() {
		await this._app.searcher.resetAllCatalogs();
	},
});

export default resetSearchData;
