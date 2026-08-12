import type {
	ResourceParseFileArgs,
	ResourceParseFormat,
} from "@ext/serach/modulith/resourceParse/ResourceParseClient";
import type { SearchArticleItems } from "@ext/serach/modulith/SearchArticle";
import type { SimpleError } from "@ext/serach/modulith/utils/SimpleError";
import type { ArticleId } from "@ics/article-search/article";
import type { Buffer } from "buffer";

export type ResourceParseWorkerInMessage =
	| ResourceParseParseResourceInMessage
	| ResourceParseParseResourceFileInMessage;

export type ResourceParseParseResourceInMessage = {
	type: "parseResource";
	requestId: string;
	format: ResourceParseFormat;
	articleId: ArticleId;
	title: string;
	data: Buffer;
};

export type ResourceParseParseResourceFileInMessage = {
	type: "parseResourceFile";
	requestId: string;
	source: ResourceParseFileArgs["source"];
	articleId: ArticleId;
	title: string;
	format: ResourceParseFormat;
	knownHash?: string;
};

export type ResourceParseWorkerOutMessage =
	| ResourceParseResultOutMessage
	| ResourceParseProgressOutMessage
	| ResourceParseErrorOutMessage;

export type ResourceParseResultOutMessage = {
	type: "result";
	requestId: string;
	items: SearchArticleItems | undefined;
	hash?: string;
};

export type ResourceParseProgressOutMessage = {
	type: "progress";
	requestId: string;
	progress: number;
};

export type ResourceParseErrorOutMessage = {
	type: "error";
	requestId: string;
	error: SimpleError;
};
