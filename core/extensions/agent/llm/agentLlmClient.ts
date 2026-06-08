import type {
	ChatCompletionMessage,
	ChatCompletionToolCall,
	ChatCompletionToolCallAcc,
	ChatCompletionToolCallDelta,
	ChatCompletionToolDefinition,
} from "./agentLlmChatCompletions";
import {
	chatCompletionToolCallAccsToCalls,
	mergeChatCompletionToolCallDeltas,
	parseChatCompletionSseJsonLines,
} from "./agentLlmChatCompletions";
import { type AgentLlmConfig, getAgentLlmConfig } from "./agentLlmConfig";
import { streamAgentLlmMockIteration } from "./agentLlmMockIteration";

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
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	};
};

export type ChatCompletionUsage = {
	prompt_tokens?: number;
	completion_tokens?: number;
	total_tokens?: number;
};

function pickReasoningPiece(
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

export type ChatIterationResult = {
	content: string | null;
	reasoning_content?: string | null;
	tool_calls?: ChatCompletionToolCall[];
	finish_reason: string | null;
};

export type AgentLlmClient = {
	providerLabel: string;
	streamChatIteration: (
		messages: ChatCompletionMessage[],
		tools: ChatCompletionToolDefinition[] | undefined,
		onContentDelta: (piece: string) => void,
		signal?: AbortSignal,
		onUsage?: (usage: ChatCompletionUsage) => void,
	) => Promise<ChatIterationResult>;
};

export async function streamAgentLlmClientIteration(options: {
	config: AgentLlmConfig;
	messages: ChatCompletionMessage[];
	tools: ChatCompletionToolDefinition[] | undefined;
	onContentDelta: (piece: string) => void;
	onUsage?: (usage: ChatCompletionUsage) => void;
	signal?: AbortSignal;
	temperature?: number;
}): Promise<{
	content: string | null;
	reasoning_content?: string | null;
	tool_calls?: ChatCompletionToolCall[];
	finish_reason: string | null;
}> {
	const { config, messages, tools, onContentDelta, onUsage, signal, temperature } = options;
	const apiKey = config.getApiKey();
	if (!apiKey) {
		throw new Error("API key is not set. Save a key in the agent settings.");
	}
	const body: Record<string, unknown> = {
		model: config.model,
		messages,
		stream: true,
	};
	body.stream_options = { include_usage: true };
	if (temperature !== undefined) {
		body.temperature = temperature;
	}
	if (tools?.length) {
		body.tools = tools;
		body.tool_choice = "auto";
	}

	const res = await fetch(config.providerUrl, {
		method: "POST",
		signal,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
			Accept: "text/event-stream",
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		let msg = res.statusText;
		try {
			const err = (await res.json()) as { error?: { message?: string } };
			msg = err.error?.message ?? msg;
		} catch {
			try {
				msg = await res.text();
			} catch {
				/* ignore */
			}
		}
		throw new Error(`agent: ${msg}`);
	}

	if (!res.body) {
		throw new Error("agent: empty response stream body");
	}

	let fullContent = "";
	let fullReasoning = "";
	const toolAccs = new Map<number, ChatCompletionToolCallAcc>();
	let finishReason: string | null = null;

	for await (const raw of parseChatCompletionSseJsonLines(res.body, { signal })) {
		const json = raw as AgentLlmStreamChunk;
		if (json.error?.message) {
			throw new Error(`agent: ${json.error.message}`);
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
		const reasoningPiece = pickReasoningPiece(json, choice);
		if (reasoningPiece) {
			fullReasoning += reasoningPiece;
		}
		mergeChatCompletionToolCallDeltas(toolAccs, delta?.tool_calls);
		if (choice.finish_reason != null && choice.finish_reason !== "") {
			finishReason = choice.finish_reason;
		}
	}

	const tool_calls = chatCompletionToolCallAccsToCalls(toolAccs);
	if (tool_calls.length > 0) {
		return {
			content: fullContent.length ? fullContent : null,
			reasoning_content: fullReasoning.length ? fullReasoning : null,
			tool_calls,
			finish_reason: finishReason,
		};
	}

	return {
		content: fullContent.length ? fullContent : null,
		reasoning_content: fullReasoning.length ? fullReasoning : null,
		finish_reason: finishReason,
	};
}

export function getAgentLlmClient(): AgentLlmClient {
	const config = getAgentLlmConfig();
	return {
		providerLabel: config.provider,
		streamChatIteration: async (messages, tools, onContentDelta, signal, onUsage) => {
			if (config.mockStream) {
				return streamAgentLlmMockIteration(messages, tools, onContentDelta, signal);
			}
			return streamAgentLlmClientIteration({
				config,
				messages,
				tools,
				onContentDelta,
				onUsage,
				signal,
				temperature: config.temperature,
			});
		},
	};
}
