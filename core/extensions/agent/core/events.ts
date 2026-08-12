import type { ToolPreview } from "../mcp/toolPreview";
import type { AgentErrorType, AgentWarningType } from "./agentError";
import type { AgentAttachment } from "./attachmentStore";

export type AgentTurnStatus = "completed" | "failed" | "cancelled";

export type AgentEvent =
	| {
			type: "user_message";
			turnId: string;
			ts: number;
			content: string;
			browserAllowed?: boolean;
			attachments?: AgentAttachment[];
			useSkill?: string;
			openCatalogName?: string;
			openItemPath?: string;
	  }
	| { type: "assistant_delta"; turnId: string; ts: number; content: string }
	| { type: "assistant_message"; turnId: string; ts: number; content: string; reasoningContent?: string }
	| {
			type: "tool_call_requested";
			turnId: string;
			ts: number;
			toolCallId: string;
			name: string;
			arguments: unknown;
			preview?: ToolPreview;
	  }
	| {
			type: "tool_result";
			turnId: string;
			ts: number;
			toolCallId: string;
			name: string;
			content?: string;
			contentPreview: string;
			fullLength: number;
			isError: boolean;
			refreshPage?: boolean;
	  }
	| {
			type: "tool_awaiting_confirmation";
			turnId: string;
			ts: number;
			correlationId: string;
			toolCallId: string;
			name: string;
			summary: string;
	  }
	| {
			type: "turn_finished";
			turnId: string;
			ts: number;
			status: AgentTurnStatus;
			refreshPage?: boolean;
	  }
	| { type: "warning"; turnId: string; ts: number; message: string; warningType: AgentWarningType }
	| { type: "error"; turnId: string; ts: number; message: string; errorType: AgentErrorType };
