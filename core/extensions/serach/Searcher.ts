import type { PropertyValue } from "@ext/properties/models";
import type { ArticleLanguage } from "@ext/serach/modulith/SearchArticle";

export default interface Searcher {
	progress: (args: ProgressArgs) => SearcherProgressGenerator;
	updateIndex: (args: UpdateIndexArgs) => Promise<void>;
	search: (args: SearchArgs) => Promise<SearchResult[]>;
}

export interface ProgressArgs {
	resourceFilter?: ResourceFilter;
	signal?: AbortSignal;
}

export interface UpdateIndexArgs {
	force?: boolean;
	catalogName?: string;
}

export interface SearchArgs {
	query?: string;
	propertyFilter?: PropertyFilter;
	resourceFilter?: ResourceFilter;
	articlesLanguage?: ArticleLanguage;
	signal?: AbortSignal;
	articleRefPaths?: Set<string>;
}

export type SearcherProgressGenerator = AsyncGenerator<ProgressItem, void, void>;

export interface InProgressItem {
	type: "progress";
	progress: number;
}

export interface DoneProgressItem {
	type: "done";
}

export type ProgressItem = InProgressItem | DoneProgressItem;

export type SearchResult = SearchArticleResult | SearchCatalogResult;

export interface SearchArticleResult {
	type: "article";
	refPath: string;
	isRecommended: boolean;
	catalog: {
		name: string;
		title: string;
		url: string;
	};
	url: string;
	breadcrumbs: { title: string; url: string }[];
	properties: PropertyValue[];
	title: SearchResultMarkItem[];
	items: SearchResultItem[];
}

export interface SearchCatalogResult {
	type: "catalog";
	name: string;
	url: string;
	title: SearchResultMarkItem[];
}

export type SearchResultItem = SearchResultBlockItem | SearchResultParagraphItem;

export interface SearchResultBlockItem {
	type: "block";
	title: SearchResultMarkItem[];
	embeddedLinkTitle?: SearchResultMarkItem[];
	items: SearchResultItem[];
}

export interface SearchResultParagraphItem {
	type: "paragraph";
	items: SearchResultMarkItem[];
	searchText: string;
}

export type SearchResultMarkItem = SearchResultTextMarkItem | SearchResultHighlightMarkItem;

export interface SearchResultTextMarkItem {
	type: "text";
	text: string;
}

export interface SearchResultHighlightMarkItem {
	type: "highlight";
	text: string;
}

export interface EqPropertyFilter {
	op: "eq";
	key: string;
	value: unknown;
}

export interface ContainsPropertyFilter {
	op: "contains";
	key: string;
	list: unknown[];
}

export interface IsEmptyPropertyFilter {
	op: "isEmpty";
	key: string;
}

export interface AndPropertyFilter {
	op: "and";
	filters: PropertyFilter[];
}

export interface OrPropertyFilter {
	op: "or";
	filters: PropertyFilter[];
}

export type PropertyFilter =
	| EqPropertyFilter
	| ContainsPropertyFilter
	| IsEmptyPropertyFilter
	| AndPropertyFilter
	| OrPropertyFilter;

export type ResourceFilter = "without" | "with" | "only";
