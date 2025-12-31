import { PropertyValue } from "@ext/properties/models";
import { ArticleLanguage } from "@ext/serach/modulith/SearchArticle";

export default interface Searcher {
	progress: () => SearcherProgressGenerator;
	updateIndex: (args: UpdateIndexArgs) => SearcherProgressGenerator;
	searchAll: (args: SearchAllArgs) => Promise<SearchResult[]>;
	search: (args: SearchArgs) => Promise<SearchResult[]>;
}

export interface UpdateIndexArgs {
	force?: boolean;
	catalogName?: string;
}

export interface SearchArgsBase {
	query?: string;
	propertyFilter?: PropertyFilter;
	articlesLanguage?: ArticleLanguage;
	signal?: AbortSignal;
}

export interface SearchAllArgs extends SearchArgsBase {
	catalogToArticleIds: { [catalogName: string]: string[] };
}

export interface SearchArgs extends SearchArgsBase {
	catalogName: string;
	articleIds: string[];
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

export type SearchResultItem = SearchResultBlockItem | SearchResultParagraphItem | SearchResultParagraphGroupItem;

export interface SearchResultBlockItem {
	type: "block";
	title: SearchResultMarkItem[];
	embeddedLinkTitle?: SearchResultMarkItem[];
	items: SearchResultItem[];
}

export interface SearchResultParagraphItem {
	type: "paragraph";
	items: SearchResultMarkItem[];
}

export interface SearchResultParagraphGroupItem {
	type: "paragraph_group";
	paragraphs: SearchResultParagraphItem[];
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
