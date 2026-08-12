import type { AgentErrorType } from "@ext/agent/core/agentError";
import type { AgentAttachment } from "@ext/agent/core/attachmentStore";
import type { ToolPreview } from "@ext/agent/mcp/toolPreview";
import type { CatalogDiff, ChatMessage, DiffBlock, DiffLine, ToolCallMessage } from "../types/chat";

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

const catalogDiffToDiffBlock = (catalogDiff: CatalogDiff): DiffBlock => {
	const lines: DiffLine[] = [];

	for (const hunk of catalogDiff.diff) {
		if (hunk.beforeText.length > 0) {
			const beforeLines = hunk.beforeText.split("\n");
			for (let i = 0; i < beforeLines.length; i++) {
				lines.push({
					type: "del" as const,
					text: beforeLines[i],
					oldNo: hunk.lineStart + i,
					newNo: undefined,
				});
			}
		}

		if (hunk.afterText.length > 0) {
			const afterLines = hunk.afterText.split("\n");
			for (let i = 0; i < afterLines.length; i++) {
				lines.push({
					type: "add" as const,
					text: afterLines[i],
					oldNo: undefined,
					newNo: hunk.lineStart + i,
				});
			}
		}
	}

	return {
		filePath: catalogDiff.itemPath,
		language: "markdown",
		lines,
	};
};

export const isCatalogDiff = (preview: unknown): preview is CatalogDiff => {
	return (
		typeof preview === "object" &&
		preview !== null &&
		"type" in preview &&
		preview.type === "update_catalog_item_diff" &&
		"itemPath" in preview &&
		"diff" in preview &&
		Array.isArray(preview.diff)
	);
};

export type AgentTimelineEntry =
	| {
			kind: "message";
			role: "user" | "assistant";
			content: string;
			ts: number;
			streaming?: boolean;
			attachments?: AgentAttachment[];
	  }
	| {
			kind: "tool_call";
			ts: number;
			name: string;
			toolCallId: string;
			arguments: Record<string, unknown>;
			preview?: unknown;
	  }
	| {
			kind: "tool_result";
			ts: number;
			name: string;
			toolCallId: string;
			content?: string;
			contentPreview: string;
			fullLength: number;
			isError: boolean;
	  }
	| { kind: "error"; ts: number; message: string; errorType: AgentErrorType }
	| { kind: "cancelled"; ts: number }
	| { kind: "turn_duration"; ts: number };

export type AgentChatViewModel = {
	messages: ChatMessage[];
	streamingMessageId: string | null;
	streamText: string;
	assistantStreaming: boolean;
};

const buildChatMessage = (entry: AgentTimelineEntry, id: string): ChatMessage | null => {
	switch (entry.kind) {
		case "message": {
			if (entry.role === "user") {
				return {
					id,
					kind: "user",
					ts: entry.ts,
					userText: entry.content,
					attachments: entry.attachments,
				};
			}
			return {
				id,
				kind: "assistant",
				ts: entry.ts,
				description: entry.content,
				isLoading: entry.streaming || undefined,
			};
		}
		case "tool_call": {
			const chatMessage: ToolCallMessage = {
				id,
				kind: "tool_call",
				ts: entry.ts,
				toolName: entry.name,
				toolCallId: entry.toolCallId,
				toolArguments: entry.arguments,
			};
			const itemTitle = (entry.preview as ToolPreview | undefined)?.itemTitle;
			if (itemTitle) chatMessage.toolItemTitle = itemTitle;
			if (entry.preview && isCatalogDiff(entry.preview)) {
				chatMessage.toolDiff = catalogDiffToDiffBlock(entry.preview);
			}
			return chatMessage;
		}
		case "tool_result":
			return {
				id,
				kind: "tool_result",
				ts: entry.ts,
				toolName: entry.name,
				toolCallId: entry.toolCallId,
				toolResultIsError: entry.isError,
				toolResultTs: entry.ts,
				toolResultContent: entry.content,
				toolResultContentPreview: entry.contentPreview,
				toolResultFullLength: entry.fullLength,
			};
		case "error":
			return {
				id,
				kind: "error",
				ts: entry.ts,
				statusText: entry.message,
				errorType: entry.errorType,
			};
		case "cancelled":
			return { id, kind: "cancelled", ts: entry.ts };
		case "turn_duration":
			return { id, kind: "turn_duration", ts: entry.ts };
		default:
			return null;
	}
};

const chatMessageByEntry = new WeakMap<AgentTimelineEntry, ChatMessage>();

export const mapAgentTimelineToViewModel = (timeline: AgentTimelineEntry[]): AgentChatViewModel => {
	const messages: ChatMessage[] = [];
	let streamingMessageId: string | null = null;
	let streamText = "";
	let assistantStreaming = false;

	for (let i = 0; i < timeline.length; i++) {
		const entry = timeline[i];

		let chatMessage = chatMessageByEntry.get(entry);
		if (!chatMessage) {
			const built = buildChatMessage(entry, `t-${i}`);
			if (!built) continue;
			chatMessage = built;
			chatMessageByEntry.set(entry, chatMessage);
		}
		messages.push(chatMessage);

		if (entry.kind === "message" && entry.role === "assistant" && entry.streaming) {
			streamingMessageId = chatMessage.id;
			streamText = entry.content;
			assistantStreaming = true;
		}
	}

	return {
		messages,
		streamingMessageId,
		streamText,
		assistantStreaming,
	};
};
