export type SuggestionState = "loading" | "generated" | "waiting_for_approval" | "applied" | "rejected";

export type MessageKind =
	| "explanation"
	| "suggestion"
	| "status"
	| "loading"
	| "error"
	| "user"
	| "permission"
	| "tool_call"
	| "tool_result";

export type PermissionAction =
	| { type: "delete_file"; path: string }
	| { type: "edit_file"; path: string }
	| { type: "run_command"; command: string; cwd?: string }
	| { type: "install_packages"; packages: string[] };

export type PermissionStatus = "pending" | "approved" | "rejected";

export type DiffLineType = "add" | "del" | "context" | "hunk";

export type DiffLine = {
	type: DiffLineType;
	text: string;
	oldNo?: number;
	newNo?: number;
};

export type DiffBlock = {
	filePath: string;
	language?: string;
	lines: DiffLine[];
};

export type CatalogDiffHunk = {
	lineStart: number;
	lineCount: number;
	beforeText: string;
	afterText: string;
};

export type CatalogDiff = {
	type: "update_catalog_item_diff";
	itemPath: string;
	diff: CatalogDiffHunk[];
};

export type ChatMessage = {
	id: string;
	kind: MessageKind;
	title?: string;
	description?: string;
	diff?: DiffBlock;
	diffs?: DiffBlock[];
	suggestionState?: SuggestionState;
	statusText?: string;
	userText?: string;
	permissionAction?: PermissionAction;
	permissionStatus?: PermissionStatus;
	toolName?: string;
	toolCallId?: string;
	toolArguments?: Record<string, unknown>;
	toolResultIsError?: boolean;
	toolResultTs?: number;
	toolResultContentPreview?: string;
	toolResultFullLength?: number;
	toolDiff?: DiffBlock;
};
