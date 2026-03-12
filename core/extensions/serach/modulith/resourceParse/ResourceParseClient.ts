import type { ArticleItem } from "@ics/modulith-search-domain/article";
import type { ProgressCallback } from "@ics/modulith-utils";
import type { Buffer } from "buffer";

export interface ResourceParseClient {
	parseResource(
		format: ResourceParseFormat,
		data: Buffer,
		progressCallback?: ProgressCallback,
	): Promise<ArticleItem[] | null>;
	terminate(): Promise<void>;
}

export type ResourceParseFormat = "pdf" | "docx";

export function isResourceParseFormat(format: string): format is ResourceParseFormat {
	return format === "pdf" || format === "docx";
}
