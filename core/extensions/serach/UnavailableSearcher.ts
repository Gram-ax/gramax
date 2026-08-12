import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import type Searcher from "@ext/serach/Searcher";
import type {
	ProgressArgs,
	SearchArgs,
	SearcherProgressGenerator,
	SearchResult,
	UpdateIndexArgs,
} from "@ext/serach/Searcher";

export class UnavailableSearcher implements Searcher {
	constructor(private _error: Error) {}

	async search(_args: SearchArgs): Promise<SearchResult[]> {
		throw new DefaultError(
			"Search unavailable",
			this._error,
			{ showCause: true, logCause: false },
			false,
			"The search could not be initiated.",
		);
	}

	async updateIndex(_args: UpdateIndexArgs): Promise<void> {}

	async *progress(_args: ProgressArgs): SearcherProgressGenerator {
		yield { type: "done" };
	}
}
