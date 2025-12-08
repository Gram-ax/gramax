import {
	ModulithSearchClient,
	SearchBatchArgs,
	SearchResult,
	UpdateArgs,
} from "@ext/serach/modulith/ModulithSearchClient";
import { AggregateProgress } from "@ics/modulith-utils";

export class AggregateModulithSearchClient implements ModulithSearchClient {
	constructor(private readonly _main: ModulithSearchClient, private readonly _extra: ModulithSearchClient) {}

	async update({ articles, filter, progressCallback }: UpdateArgs): Promise<void> {
		const aggProgress = new AggregateProgress({
			progress: {
				count: 2,
			},
			onChange: (p) => progressCallback?.(p),
		});

		await Promise.all([
			this._main.update({ articles, filter, progressCallback: aggProgress.getProgressCallback(0) }),
			this._extra.update({ articles, filter, progressCallback: aggProgress.getProgressCallback(1) }),
		]);
	}

	searchBatch(args: SearchBatchArgs): Promise<SearchResult[][]> {
		return this._main.searchBatch(args);
	}
}
