import Context from "@core/Context/Context";
import { SearchItem } from "@ext/search/Searcher";
import { Command, ResponseKind } from "../../types/Command";

const search: Command<{ ctx: Context; query: string; catalogName?: string }, SearchItem[]> = Command.create({
	path: "search",

	kind: ResponseKind.json,

	async do({ ctx, query, catalogName }) {
		const provider = this._app.sitePresenterFactory.fromContext(ctx);
		return catalogName ? await provider.getSearchData(query, catalogName) : await provider.getAllSearchData(query);
	},

	params(ctx, q) {
		const query = q.query;
		const catalogName = q.catalogName;
		return { ctx, query, catalogName };
	},
});

export default search;
