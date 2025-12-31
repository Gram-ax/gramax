import { ResponseKind } from "@app/types/ResponseKind";
import { genNDJson } from "@core/utils/genNDJson";
import { isSearcherType, SearcherType } from "@ext/serach/SearcherManager";
import { Command } from "../../types/Command";

const resetSearchData: Command<
	{ type?: SearcherType; force?: boolean; catalogName?: string },
	{ mime: string; iterator: AsyncGenerator<string, void, void> }
> = Command.create({
	path: "search/resetSearchData",

	kind: ResponseKind.stream,

	async do({ type, force, catalogName }) {
		const progressGen = this._app.searcherManager.getSearcher(type).updateIndex({ force, catalogName });

		return {
			mime: "application/x-ndjson",
			iterator: genNDJson(progressGen),
		};
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
