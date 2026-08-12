import type { CommandTree } from "@app/commands";
import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type { AgentLlmClient, ChatCompletionToolCall, ChatCompletionUsage } from "../llm";
import { buildToolPreview } from "../mcp/toolPreview";
import { agentConfig } from "./agentConfig";
import { AgentErrorType } from "./agentError";
import type { AgentEvent } from "./events";

export type AgentLoopCallbacks = {
	onEvent: (e: AgentEvent) => void;
};

export async function runAgentTurn(options: {
	turnId: string;
	sessionId: string;
	app: Application;
	ctx: Context;
	commands: CommandTree;
	llmClient: AgentLlmClient;
	events: AgentEvent[];
	callbacks: AgentLoopCallbacks;
	onLlmUsage?: (usage: ChatCompletionUsage) => void;
	signal?: AbortSignal;
}): Promise<void> {
	const { turnId, sessionId, app, ctx, commands, llmClient, events, callbacks, onLlmUsage, signal } = options;
	const maxSteps = agentConfig.maxSteps;
	const previewMax = agentConfig.toolPreviewMaxChars;
	const push = (e: AgentEvent) => callbacks.onEvent(e);
	const toolRegistry = app.agentManager.toolRegistry;
	const session = app.agentManager.sessions.get(sessionId);
	const catalogName = session?.openCatalogName ?? undefined;

	const tools = llmClient.mapper.toolsToLlmFormat(await toolRegistry.getTools(app, ctx, commands, sessionId));

	for (let step = 0; maxSteps === null || step < maxSteps; step++) {
		const messages = await llmClient.mapper.eventsToMessages(app, ctx, commands, events, catalogName);
		const streamed = await llmClient.chat.streamIteration(
			llmClient.adapter,
			messages,
			tools.length ? tools : undefined,
			(piece) => push({ type: "assistant_delta", turnId, ts: Date.now(), content: piece }),
			signal,
			onLlmUsage,
		);

		const toolCalls = streamed.tool_calls;
		const textOut = typeof streamed.content === "string" ? streamed.content : "";

		if (!toolCalls?.length && streamed.content == null) {
			push({
				type: "error",
				turnId,
				ts: Date.now(),
				message: "Empty response from model",
				errorType: AgentErrorType.Unexpected,
			});
			return;
		}

		if (textOut || streamed.reasoning_content) {
			push({
				type: "assistant_message",
				turnId,
				ts: Date.now(),
				content: textOut,
				reasoningContent: streamed.reasoning_content ?? undefined,
			});
		}

		if (toolCalls?.length) {
			for (const tc of toolCalls) {
				await executeOneToolCall({
					tc,
					turnId,
					app,
					ctx,
					commands,
					sessionId,
					push,
					previewMax,
				});
			}
			continue;
		}

		return;
	}

	push({
		type: "error",
		turnId,
		ts: Date.now(),
		message: `Agent step limit exceeded (${maxSteps})`,
		errorType: AgentErrorType.MaxStepsExceeded,
	});
}

async function executeOneToolCall(options: {
	tc: ChatCompletionToolCall;
	turnId: string;
	app: Application;
	ctx: Context;
	commands: CommandTree;
	sessionId: string;
	push: (e: AgentEvent) => void;
	previewMax: number;
}): Promise<void> {
	const { tc, turnId, app, ctx, commands, sessionId, push, previewMax } = options;
	const toolRegistry = app.agentManager.toolRegistry;
	const name = tc.function.name;
	let args: unknown = {};
	const argumentsText = tc.function.arguments ?? "{}";
	try {
		args = argumentsText ? JSON.parse(argumentsText) : {};
	} catch {
		args = { raw: argumentsText };
	}
	const preview = await buildToolPreview(args, app, ctx);

	push({
		type: "tool_call_requested",
		turnId,
		ts: Date.now(),
		toolCallId: tc.id,
		name,
		arguments: args,
		preview,
	});

	const decision = await toolRegistry.policy.beforeToolCall({
		sessionId,
		toolName: name,
		args,
	});

	if (decision.decision === "pending_approval") {
		push({
			type: "tool_awaiting_confirmation",
			turnId,
			ts: Date.now(),
			correlationId: decision.correlationId,
			toolCallId: tc.id,
			name,
			summary: decision.summary,
		});
		push({
			type: "error",
			turnId,
			ts: Date.now(),
			message: "Tool confirmation is not implemented",
			errorType: AgentErrorType.Unexpected,
		});
		return;
	}

	const toolResult = await toolRegistry.executeTool(name, args, app, ctx, commands, sessionId);
	let text: string;
	if (toolResult.ok) {
		text = JSON.stringify(toolResult.data ?? null, null, 2);
	} else if (toolResult.data !== undefined) {
		text = JSON.stringify({ error: toolResult.error, data: toolResult.data }, null, 2);
	} else {
		text = toolResult.error ?? "";
	}
	const contentPreview =
		text.length <= previewMax ? text : `${text.slice(0, previewMax)}… [truncated, ${text.length} characters total]`;
	const shouldRefreshPage = toolResult.ok && toolResult.refreshPage === true;

	push({
		type: "tool_result",
		turnId,
		ts: Date.now(),
		toolCallId: tc.id,
		name,
		content: text,
		contentPreview,
		fullLength: text.length,
		isError: !toolResult.ok,
		refreshPage: shouldRefreshPage,
	});
}
