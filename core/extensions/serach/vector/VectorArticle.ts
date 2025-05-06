import { Article } from "@ics/gx-vector-search";

export interface VectorArticleMetadata {
	logicPath: string;
	refPath: string;
	title: string;
}

export type VectorArticle = Article<VectorArticleMetadata>;
