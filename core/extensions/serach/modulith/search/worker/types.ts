import type { SearchArticleMetadata } from "@ext/serach/modulith/SearchArticle";
import type {
	GetArticlePayloadsArgs,
	GetArticlePayloadsResult,
	SearchBatchArgs,
	SearchResult,
	UpdateArgs,
} from "@ext/serach/modulith/search/ModulithSearchClient";
import type { SimpleError } from "@ext/serach/modulith/utils/SimpleError";

export type SearchWorkerInMessage =
	| SearchWorkerInitInMessage
	| SearchWorkerUpdateInMessage
	| SearchWorkerCommitInMessage
	| SearchWorkerSearchBatchInMessage
	| SearchWorkerGetArticlePayloadsInMessage
	| SearchWorkerFsInMessage;

export type SearchWorkerInitInMessage = {
	type: "init";
	requestId: string;
	tenant: string;
	cacheRoot: string;
	articleStorageRoot: string;
};

export type SearchWorkerUpdateInMessage = {
	type: "update";
	requestId: string;
	args: UpdateArgs;
};

export type SearchWorkerCommitInMessage = {
	type: "commit";
	requestId: string;
};

export type SearchWorkerSearchBatchInMessage = {
	type: "searchBatch";
	requestId: string;
	args: SearchBatchArgs;
};

export type SearchWorkerGetArticlePayloadsInMessage = {
	type: "getArticlePayloads";
	requestId: string;
	args: GetArticlePayloadsArgs;
};

export type SearchWorkerFsInMessage = {
	type: "fs";
	requestId: string;
} & ({ ok: true; result: unknown } | { ok: false; error: SimpleError });

export type SearchWorkerOutMessage =
	| SearchWorkerOkOutMessage
	| SearchWorkerResultSearchBatchOutMessage
	| SearchWorkerResultGetArticlePayloadsOutMessage
	| SearchWorkerResultErrorOutMessage
	| SearchWorkerResultProgressOutMessage
	| SearchWorkerFsOutMessage;

export type SearchWorkerOkOutMessage = {
	type: "ok";
	requestId: string;
};

export type SearchWorkerResultSearchBatchOutMessage = {
	type: "searchResult";
	requestId: string;
	result: SearchResult[][];
};

export type SearchWorkerResultGetArticlePayloadsOutMessage = {
	type: "getArticlePayloads";
	requestId: string;
	result: GetArticlePayloadsResult<SearchArticleMetadata>;
};

export type SearchWorkerResultErrorOutMessage = {
	type: "error";
	requestId: string;
	error: SimpleError;
};

export type SearchWorkerResultProgressOutMessage = {
	type: "progress";
	requestId: string;
	progress: number;
};

export type SearchWorkerFsOutMessage = {
	type: "fs";
	requestId: string;
	scope: FsScope;
	method: FsRequestMethod;
	args: Record<string, unknown>;
};

export type FsScope = "cache" | "articleStorage";

export type FsRequestMethod =
	| "exists"
	| "write"
	| "read"
	| "delete"
	| "mkdir"
	| "readdir"
	| "isRootPathExists"
	| "createRootPathIfNeed";
