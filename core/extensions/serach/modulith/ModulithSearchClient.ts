import { SearchArticle, SearchArticleFilter, SearchArticleMetadata } from "@ext/serach/modulith/SearchArticle";
import { SearchResultItem, SearchResultMarkItem } from "@ext/serach/Searcher";
import { ProgressCallback } from "@ics/modulith-utils";

export interface ModulithSearchClient {
	update(args: UpdateArgs): Promise<void>;
	searchBatch(args: SearchBatchArgs): Promise<SearchResult[][]>;
}

export interface UpdateArgs {
	articles: SearchArticle[];
	filter?: SearchArticleFilter;
	progressCallback?: ProgressCallback;
}

export interface SearchBatchArgs {
	items: {
		query: string;
		filter: SearchArticleFilter;
	}[];
	signal?: AbortSignal;
}

export interface SearchResult {
	article: FoundArticle<SearchArticleMetadata>;
	title: SearchResultMarkItem[];
	items: SearchResultItem[];
}

export interface FoundArticle<TMetadata> {
	id: string;
	title: string;
	metadata: TMetadata;
}