import { ContentLanguage } from "@ext/localization/core/model/Language";
import { Article } from "@ics/gx-vector-search";

export type ArticleLanguage = ContentLanguage | "none";

export type VectorArticleMetadata = {
	catalogId: string;
	refPath: string;
	lang: ArticleLanguage;
	properties: Record<string, unknown>;
}

export type VectorArticle = Article<VectorArticleMetadata>;
