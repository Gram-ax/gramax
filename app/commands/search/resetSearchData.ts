import { isSearcherType, SearcherType } from "@ext/serach/SearcherManager";
import { Command } from "../../types/Command";

const resetSearchData: Command<{ type?: SearcherType }, void> = Command.create({
	path: "search/resetSearchData",

	async do({ type }) {
		await this._app.searcherManager.getSearcher(type).resetAllCatalogs();
	},

	params(_, q) {
		return { type: isSearcherType(q.type) ? q.type : null };
	},
});

export default resetSearchData;
