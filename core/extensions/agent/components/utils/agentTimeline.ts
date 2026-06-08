import type { CatalogDiff, ChatMessage, DiffBlock, DiffLine } from "../types/chat";

export function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function catalogDiffToDiffBlock(catalogDiff: CatalogDiff): DiffBlock {
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
}

export function isCatalogDiff(preview: unknown): preview is CatalogDiff {
	return (
		typeof preview === "object" &&
		preview !== null &&
		"type" in preview &&
		preview.type === "update_catalog_item_diff" &&
		"itemPath" in preview &&
		"diff" in preview &&
		Array.isArray(preview.diff)
	);
}

export type AgentTimelineEntry =
	| {
			kind: "message";
			role: "user" | "assistant";
			content: string;
			ts: number;
			streaming?: boolean;
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
			contentPreview: string;
			fullLength: number;
			isError: boolean;
	  }
	| { kind: "error"; ts: number; message: string };

export type AgentChatViewModel = {
	messages: ChatMessage[];
	streamingMessageId: string | null;
	streamText: string;
	assistantStreaming: boolean;
};

export function mapAgentTimelineToViewModel(timeline: AgentTimelineEntry[]): AgentChatViewModel {
	const messages: ChatMessage[] = [];
	let streamingMessageId: string | null = null;
	let streamText = "";
	let assistantStreaming = false;

	for (let i = 0; i < timeline.length; i++) {
		const entry = timeline[i];
		const id = `t-${i}`;
		switch (entry.kind) {
			case "message": {
				if (entry.role === "user") {
					messages.push({
						id,
						kind: "user",
						userText: entry.content,
					});
				} else {
					messages.push({
						id,
						kind: "explanation",
						description: entry.content,
						suggestionState: entry.streaming ? "loading" : undefined,
					});
					if (entry.streaming) {
						streamingMessageId = id;
						streamText = entry.content;
						assistantStreaming = true;
					}
				}
				break;
			}
			case "tool_call": {
				const chatMessage: ChatMessage = {
					id,
					kind: "tool_call",
					toolName: entry.name,
					toolCallId: entry.toolCallId,
					toolArguments: entry.arguments,
				};

				if (entry.preview && isCatalogDiff(entry.preview)) {
					chatMessage.toolDiff = catalogDiffToDiffBlock(entry.preview);
				}

				messages.push(chatMessage);
				break;
			}
			case "tool_result":
				messages.push({
					id,
					kind: "tool_result",
					toolName: entry.name,
					toolCallId: entry.toolCallId,
					toolResultIsError: entry.isError,
					toolResultTs: entry.ts,
					toolResultContentPreview: entry.contentPreview,
					toolResultFullLength: entry.fullLength,
				});
				break;
			case "error":
				messages.push({
					id,
					kind: "error",
					statusText: entry.message,
				});
				break;
			default:
				break;
		}
	}

	return {
		messages,
		streamingMessageId,
		streamText,
		assistantStreaming,
	};
}
