import type { ResourceReadSource } from "@core/FileProvider/ResourceReadSource";
import type { SearchArticleItems } from "@ext/serach/modulith/SearchArticle";
import type { ArticleId } from "@ics/article-search/article";
import type { ProgressCallback } from "@ics/article-search-utils";
import type { Buffer } from "buffer";

export interface ResourceParseClient {
	parseResource(
		articleId: ArticleId,
		title: string,
		format: ResourceParseFormat,
		data: Buffer,
		progressCallback?: ProgressCallback,
	): Promise<SearchArticleItems | null>;
	parseResourceFile?(
		args: ResourceParseFileArgs,
		progressCallback?: ProgressCallback,
	): Promise<ResourceParseFileResult | null>;
	terminate(): Promise<void>;
}

export type ResourceParseFileArgs = {
	source: ResourceReadSource;
	articleId: ArticleId;
	title: string;
	format: ResourceParseFormat;
	knownHash?: string;
};

export type ResourceParseFileResult = {
	hash: string;
	items: SearchArticleItems | undefined;
};

export type ResourceParseFormat = "pdf" | "docx";

export function isResourceParseFormat(format: string): format is ResourceParseFormat {
	return format === "pdf" || format === "docx";
}
