import { AgentError, AgentErrorType } from "../core/agentError";
import type { AgentLlmAdapter } from "./agentLlmAdapter";
import { agentLlmConfig } from "./agentLlmConfig";
import type {
	ChatCompletionMessage,
	ChatCompletionToolCall,
	ChatCompletionToolDefinition,
	ChatCompletionUsage,
	ChatIterationResult,
} from "./agentLlmContracts";

export class AgentLlmChat {
	async streamIteration(
		adapter: AgentLlmAdapter,
		messages: ChatCompletionMessage[],
		tools: ChatCompletionToolDefinition[] | undefined,
		onContentDelta: (piece: string) => void,
		signal?: AbortSignal,
		onUsage?: (usage: ChatCompletionUsage) => void,
	): Promise<ChatIterationResult> {
		const apiKey = adapter.apiKey;
		if (!apiKey) {
			throw new AgentError(AgentErrorType.Unauthorized, "API key is not set. Save a key in the agent settings.");
		}

		const requestBody: Record<string, unknown> = {
			model: agentLlmConfig.model,
			messages,
			stream: true,
			stream_options: { include_usage: true },
			temperature: agentLlmConfig.temperature,
		};
		if (tools?.length) {
			requestBody.tools = tools;
			requestBody.tool_choice = "auto";
		}

		let response: Response;
		try {
			response = await fetch(adapter.url, {
				method: "POST",
				signal,
				headers: adapter.getHeaders(),
				body: JSON.stringify(requestBody),
			});
		} catch {
			throw new AgentError(AgentErrorType.NetworkError, "Network error");
		}

		if (!response.ok) {
			let message = response.statusText;
			try {
				const errorPayload = (await response.json()) as { error?: { message?: string } };
				message = errorPayload.error?.message ?? message;
			} catch {
				message = await response.text().catch(() => message);
			}
			const errorType =
				response.status === 401
					? AgentErrorType.Unauthorized
					: response.status === 402
						? AgentErrorType.PaymentRequired
						: AgentErrorType.Unexpected;
			throw new AgentError(errorType, message);
		}

		if (!response.body) {
			throw new AgentError(AgentErrorType.Unexpected, "Empty response stream body");
		}

		return this._collectStreamChatIterationResult(response.body, onContentDelta, { signal, onUsage });
	}

	private async _collectStreamChatIterationResult(
		body: ReadableStream<Uint8Array>,
		onContentDelta: (piece: string) => void,
		options?: { signal?: AbortSignal; onUsage?: (usage: ChatCompletionUsage) => void },
	): Promise<ChatIterationResult> {
		const signal = options?.signal;
		const onUsage = options?.onUsage;
		let fullContent = "";
		let fullReasoning = "";
		const toolAccs = new Map<number, { id: string; name: string; arguments: string }>();
		let finishReason: string | null = null;

		for await (const raw of this._parseChatCompletionSseJsonLines(body, { signal })) {
			const json = raw as AgentLlmStreamChunk;
			if (json.error?.message) {
				throw new AgentError(AgentErrorType.Unexpected, json.error.message);
			}
			if (json.usage) {
				onUsage?.(json.usage);
			}
			const choice = json.choices?.[0];
			if (!choice) continue;
			const delta = choice.delta;
			if (delta?.content) {
				fullContent += delta.content;
				onContentDelta(delta.content);
			}
			const reasoningPiece = this._pickReasoningPiece(json, choice);
			if (reasoningPiece) {
				fullReasoning += reasoningPiece;
			}
			this._mergeToolCallDeltas(toolAccs, delta?.tool_calls);
			if (choice.finish_reason != null && choice.finish_reason !== "") {
				finishReason = choice.finish_reason;
			}
		}

		const toolCalls = this._toolCallAccsToCalls(toolAccs);
		return {
			content: fullContent.length ? fullContent : null,
			reasoning_content: fullReasoning.length ? fullReasoning : null,
			...(toolCalls.length ? { tool_calls: toolCalls } : {}),
			finish_reason: finishReason,
		};
	}

	private _mergeToolCallDeltas(
		accs: Map<number, { id: string; name: string; arguments: string }>,
		deltas: ChatCompletionToolCallDelta[] | undefined,
	): void {
		if (!deltas?.length) return;
		for (const part of deltas) {
			const idx = typeof part.index === "number" ? part.index : 0;
			let call = accs.get(idx);
			if (!call) {
				call = { id: "", name: "", arguments: "" };
				accs.set(idx, call);
			}
			if (part.id) call.id = part.id;
			if (part.function?.name) call.name += part.function.name;
			if (part.function?.arguments) call.arguments += part.function.arguments;
		}
	}

	private _toolCallAccsToCalls(
		accs: Map<number, { id: string; name: string; arguments: string }>,
	): ChatCompletionToolCall[] {
		const indices = [...accs.keys()].sort((a, b) => a - b);
		return indices.map((index) => {
			const call = accs.get(index)!;
			return {
				id: call.id,
				type: "function" as const,
				function: { name: call.name, arguments: call.arguments },
			};
		});
	}

	private async *_parseChatCompletionSseJsonLines(
		body: ReadableStream<Uint8Array>,
		options?: { signal?: AbortSignal },
	): AsyncGenerator<unknown, void, undefined> {
		const signal = options?.signal;
		const reader = body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		for (;;) {
			if (signal?.aborted) return;
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			for (;;) {
				const separator = buffer.match(/\r?\n\r?\n/);
				if (!separator || separator.index === undefined) break;
				const rawBlock = buffer.slice(0, separator.index);
				buffer = buffer.slice(separator.index + separator[0].length);
				const dataLine = rawBlock.split(/\r?\n/).find((line) => line.startsWith("data:"));
				if (!dataLine) continue;
				const payload = dataLine.slice(5).trim();
				if (payload === "[DONE]") return;
				try {
					yield JSON.parse(payload) as unknown;
				} catch {
					/* skip invalid JSON */
				}
			}
		}
	}

	private _pickReasoningPiece(
		json: AgentLlmStreamChunk,
		choice: NonNullable<AgentLlmStreamChunk["choices"]>[number],
	): string {
		const candidates = [
			choice.delta?.reasoning_content,
			choice.delta?.reasoning,
			choice.message?.reasoning_content,
			choice.message?.reasoning,
			json.reasoning_content,
			json.reasoning,
		];
		for (const candidate of candidates) {
			if (typeof candidate === "string" && candidate.length > 0) return candidate;
		}
		return "";
	}
}

type ChatCompletionToolCallDelta = {
	index?: number;
	id?: string;
	type?: string;
	function?: { name?: string; arguments?: string };
};

type AgentLlmStreamChunk = {
	choices?: Array<{
		delta?: {
			role?: string;
			content?: string | null;
			reasoning_content?: string | null;
			reasoning?: string | null;
			tool_calls?: ChatCompletionToolCallDelta[];
		};
		message?: {
			content?: string | null;
			reasoning_content?: string | null;
			reasoning?: string | null;
		};
		finish_reason?: string | null;
	}>;
	error?: { message?: string };
	reasoning_content?: string | null;
	reasoning?: string | null;
	usage?: ChatCompletionUsage;
};
