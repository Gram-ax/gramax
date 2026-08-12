import { ContentLanguage } from "@ext/localization/core/model/Language";
import type { Article, ArticleFilter, ArticleItems } from "@ics/article-search/article";
import type { FieldsToArrayPaths } from "@ics/article-search-utils";
import type { Article as RemoteArticle } from "@ics/gx-vector-search";

export type ArticleLanguage = ContentLanguage | "none";

export function isArticleLanguage(str: string | undefined): str is ArticleLanguage {
	return str != null && (str === "none" || ContentLanguage[str] != null);
}

export type SearchArticleMetadataBase = {
	wsPath: string;
	catalogId: string;
	lang: ArticleLanguage;
};

export type SearchArticleArticleMetadata = SearchArticleMetadataBase & {
	type: "article";
	refPath: string;
	logicPath: string;
	properties: Record<string, unknown>;
};

export type SearchArticleCatalogMetadata = SearchArticleMetadataBase & {
	type: "catalog";
};

export type SearchArticleFileMetadata = SearchArticleMetadataBase & {
	type: "file";
	id: string;
	hash: string;
	articleId: string;
	refPath: string;
	properties: Record<string, unknown>;
};

export type SearchArticleMetadata =
	| SearchArticleArticleMetadata
	| SearchArticleCatalogMetadata
	| SearchArticleFileMetadata;

export type SearchDiagramItemMetadata = {
	type: "diagram";
	diagramType: string;
};

export type SearchArticleItemMetadata = SearchDiagramItemMetadata | undefined;

export type SearchArticleItems = ArticleItems<SearchArticleItemMetadata>;

export type SearchArticle = Article<SearchArticleMetadata, SearchArticleItemMetadata>;
export type RemoteSearchArticle = RemoteArticle<SearchArticleArticleMetadata>;

export type SearchArticleKey = FieldsToArrayPaths<SearchArticleMetadata>;
export type SearchArticleFilter = ArticleFilter<SearchArticleKey>;
