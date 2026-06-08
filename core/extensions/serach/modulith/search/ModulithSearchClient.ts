import type { SearchArticle, SearchArticleFilter, SearchArticleMetadata } from "@ext/serach/modulith/SearchArticle";
import type {
	SearchResultBlockItem as SearcherSearchResultBlockItem,
	SearchResultDiagramItem as SearcherSearchResultDiagramItem,
	SearchResultParagraphItem as SearcherSearchResultParagraphItem,
	SearchResultMarkItem,
} from "@ext/serach/Searcher";
import type { ProgressCallback } from "@ics/article-search-utils";

export interface ModulithSearchClient {
	update(args: UpdateArgs): Promise<void>;
	searchBatch(args: SearchBatchArgs): Promise<SearchResult[][]>;
	getArticlePayloads<TMetadata extends SearchArticleMetadata = SearchArticleMetadata>(
		args: GetArticlePayloadsArgs,
	): Promise<GetArticlePayloadsResult<TMetadata>>;
	commit(): Promise<void>;
	terminate(): Promise<void>;
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
	breadcrumbs: SearchResultBreadcrumb[];
	title: SearchResultMarkItem[];
	items: SearchResultItem[];
}

export interface SearchResultBreadcrumb {
	article: FoundArticle<SearchArticleMetadata>;
	title: SearchResultMarkItem[];
}

export type SearchResultItem = SearchResultBlockItem | SearchResultDiagramItem | SearchResultParagraphItem;

export interface SearchResultBlockItem extends Omit<SearcherSearchResultBlockItem, "items"> {
	items: SearchResultItem[];
}

export interface SearchResultDiagramItem extends Omit<SearcherSearchResultDiagramItem, "items"> {
	items: SearchResultItem[];
}

export interface SearchResultParagraphItem extends Omit<SearcherSearchResultParagraphItem, "searchText"> {}

export interface FoundArticle<TMetadata> {
	id: string;
	title: string;
	metadata: TMetadata;
}

export interface GetArticlePayloadsArgs {
	items: {
		filter?: SearchArticleFilter;
	}[];
}

export interface GetArticlePayloadsResult<TMetadata extends SearchArticleMetadata> {
	articles: FoundArticle<TMetadata>[][];
}
