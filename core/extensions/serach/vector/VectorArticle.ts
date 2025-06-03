import { ContentLanguage } from "@ext/localization/core/model/Language";
import { Article } from "@ics/gx-vector-search";

export type ArticleLanguage = ContentLanguage | "none";

export interface VectorArticleMetadata {
	catalogId: string;
	logicPath: string;
	refPath: string;
	title: string;
	lang: ArticleLanguage;
}

export type VectorArticle = Article<VectorArticleMetadata>;
