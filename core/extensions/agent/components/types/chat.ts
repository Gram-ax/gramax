import type { AgentBrowserSessionMeta } from "@ext/agent/browser/browserHost";
import type { AgentErrorType, AgentWarningType } from "@ext/agent/core/agentError";
import type { AgentAttachment } from "@ext/agent/core/attachmentStore";
import type { AgentEvent } from "@ext/agent/core/events";
import type { AgentUsage } from "@ext/agent/core/session";

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

type ChatMessageBase = {
	id: string;
	ts?: number;
};

type ToolMessageBase = ChatMessageBase & {
	toolName: string;
	toolCallId: string;
};

export type UserChatMessage = ChatMessageBase & {
	kind: "user";
	userText: string;
	attachments?: AgentAttachment[];
};

export type AssistantChatMessage = ChatMessageBase & {
	kind: "assistant";
	description: string;
	isLoading?: boolean;
};

export type ErrorMessage = ChatMessageBase & {
	kind: "error";
	statusText: string;
	errorType?: AgentErrorType;
};

export type WarningMessage = ChatMessageBase & {
	kind: "warning";
	statusText: string;
	warningType?: AgentWarningType;
};

export type CancelledMessage = ChatMessageBase & { kind: "cancelled" };

export type TurnDurationMessage = ChatMessageBase & { kind: "turn_duration" };

export type ToolCallMessage = ToolMessageBase & {
	kind: "tool_call";
	toolArguments: Record<string, unknown>;
	toolItemTitle?: string;
	toolDiff?: DiffBlock;
};

export type ToolResultMessage = ToolMessageBase & {
	kind: "tool_result";
	toolResultIsError: boolean;
	toolResultTs: number;
	toolResultContent?: string;
	toolResultContentPreview: string;
	toolResultFullLength: number;
};

export type ChatMessage =
	| UserChatMessage
	| AssistantChatMessage
	| ErrorMessage
	| WarningMessage
	| CancelledMessage
	| TurnDurationMessage
	| ToolCallMessage
	| ToolResultMessage;

export type AgentDraftAttachment = {
	name: string;
	mime: string;
	size: number;
	content: string;
};

export type AgentDraftSnapshot = {
	text: string;
	selectedSkillName: string | null;
	updatedAt: number;
	attachments?: AgentDraftAttachment[];
};

export type SessionTabItem = {
	id: string;
	title: string;
	createdAt?: number;
	hasUserMessage?: boolean;
};

export type SessionStatePayload = {
	id?: string;
	title?: string;
	error?: string;
	processing?: boolean;
	events?: AgentEvent[];
	openCatalogName?: string | null;
	openItemPath?: string | null;
	cancelled?: boolean;
	lastError?: string | null;
	usage?: AgentUsage;
	browser?: AgentBrowserSessionMeta;
};
