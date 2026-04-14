import type { ResourceParseFormat } from "@ext/serach/modulith/resourceParse/ResourceParseClient";
import type { SimpleError } from "@ext/serach/modulith/utils/SimpleError";
import type { ArticleItem } from "@ics/modulith-search-domain/article";
import type { Buffer } from "buffer";

export type ResourceParseWorkerInMessage = ResourceParseParseResourceInMessage;

export type ResourceParseParseResourceInMessage = {
	type: "parseResource";
	requestId: string;
	format: ResourceParseFormat;
	data: Buffer;
};

export type ResourceParseWorkerOutMessage =
	| ResourceParseResultOutMessage
	| ResourceParseProgressOutMessage
	| ResourceParseErrorOutMessage;

export type ResourceParseResultOutMessage = {
	type: "result";
	requestId: string;
	items: ArticleItem[];
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
