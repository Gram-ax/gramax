import { Command } from "../../types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { genNDJson } from "@core/utils/genNDJson";
import { isSearcherType, SearcherType } from "@ext/serach/SearcherManager";

const getIndexingProgress: Command<
	{ type?: SearcherType },
	{ mime: string; iterator: AsyncGenerator<string, void, void> }
> = Command.create({
	path: "search/getIndexingProgress",

	kind: ResponseKind.stream,

	do({ type }) {
		const progressGen = this._app.searcherManager.getSearcher(type).progress();

		return {
			mime: "application/x-ndjson",
			iterator: genNDJson(progressGen),
		};
	},

	params(_, q) {
		return { type: isSearcherType(q.type) ? q.type : null };
	},
});

export default getIndexingProgress;
