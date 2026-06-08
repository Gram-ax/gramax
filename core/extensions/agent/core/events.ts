import type { DiffMeta } from "./policy";

export type AgentEvent =
	| { type: "user_message"; ts: number; content: string }
	| { type: "assistant_delta"; ts: number; content: string }
	| { type: "assistant_message"; ts: number; content: string; reasoningContent?: string | null }
	| {
			type: "tool_call_requested";
			ts: number;
			toolCallId: string;
			name: string;
			arguments: unknown;
			content?: string | null;
			reasoningContent?: string | null;
			preview?: unknown;
			diffMeta?: DiffMeta;
	  }
	| {
			type: "tool_result";
			ts: number;
			toolCallId: string;
			name: string;
			content?: string;
			contentPreview: string;
			fullLength: number;
			isError: boolean;
			refreshPage?: boolean;
			preview?: unknown;
			diffMeta?: DiffMeta;
	  }
	| {
			type: "tool_awaiting_confirmation";
			ts: number;
			correlationId: string;
			toolCallId: string;
			name: string;
			summary: string;
	  }
	| { type: "turn_completed"; ts: number }
	| { type: "error"; ts: number; message: string };
