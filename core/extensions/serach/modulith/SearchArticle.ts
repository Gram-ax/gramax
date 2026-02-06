import { ContentLanguage } from "@ext/localization/core/model/Language";
import { Article, FieldsToDotPaths } from "@ics/gx-vector-search";
import { ArticleFilter } from "@ics/modulith-search-domain/article";

export type ArticleLanguage = ContentLanguage | "none";

export function isArticleLanguage(str: string | undefined): str is ArticleLanguage {
	return str != undefined && (str === "none" || ContentLanguage[str] != undefined);
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
	properties: Record<string, unknown>;
};

export type SearchArticleMetadata =
	| SearchArticleArticleMetadata
	| SearchArticleCatalogMetadata
	| SearchArticleFileMetadata;

export type SearchArticle = Article<SearchArticleMetadata>;

export type SearchArticleFilter = ArticleFilter<FieldsToDotPaths<SearchArticleMetadata>>;
