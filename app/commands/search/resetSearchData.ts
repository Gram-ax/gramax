import { ResponseKind } from "@app/types/ResponseKind";
import { isSearcherType, type SearcherType } from "@ext/serach/SearcherManager";
import { Command } from "../../types/Command";

const resetSearchData: Command<{ type?: SearcherType; force?: boolean; catalogName?: string }, void> = Command.create({
	path: "search/resetSearchData",

	kind: ResponseKind.none,

	async do({ type, force, catalogName }) {
		const searcher = this._app.searcherManager.getSearcher(type);
		await searcher.updateIndex({ force, catalogName });
	},

	params(_, q) {
		return {
			type: isSearcherType(q.type) ? q.type : null,
			force: q.force ? q.force === "true" : undefined,
			catalogName: q.catalogName,
		};
	},
});

export default resetSearchData;
