import { ResponseKind } from "@app/types/ResponseKind";
import { genNDJson } from "@core/utils/genNDJson";
import type { ResourceFilter } from "@ext/serach/Searcher";
import { isSearcherType, type SearcherType } from "@ext/serach/SearcherManager";
import { Command } from "../../types/Command";

const getIndexingProgress: Command<
	{ type?: SearcherType; resourceFilter?: ResourceFilter; signal?: AbortSignal },
	{ mime: string; iterator: AsyncGenerator<string, void, void> }
> = Command.create({
	path: "search/getIndexingProgress",

	kind: ResponseKind.stream,

	do({ type, resourceFilter, signal }) {
		const searcher = this._app.searcherManager.getSearcher(type);

		const generator = async function* () {
			while (true) {
				if (signal?.aborted) {
					break;
				}

				const ndJson = genNDJson(searcher.progress({ resourceFilter, signal }));
				for await (const item of ndJson) {
					if (signal?.aborted) {
						break;
					}

					yield item;
				}

				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		};

		return {
			mime: "application/x-ndjson",
			iterator: generator(),
		};
	},

	params(_, q, _body, signal) {
		return {
			type: isSearcherType(q.type) ? q.type : null,
			resourceFilter: q.resourceFilter as ResourceFilter | undefined,
			signal,
		};
	},
});

export default getIndexingProgress;
