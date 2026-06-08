import type { CommandTree } from "@app/commands";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import {
	type ChatCompletionMessage,
	type ChatCompletionToolCall,
	type ChatCompletionUsage,
	getAgentLlmClient,
	getAgentLlmConfig,
} from "../llm";
import type { ToolSession } from "../mcp/tool";
import { normalizePath } from "../mcp/utils/catalogPaths";
import { getCurrentContextDescription, getSkillsDescriptions, getSystemPrompt } from "../prompts";
import type { AgentEvent } from "./events";
import type { ToolCallPolicy } from "./policy";

export type AgentLoopCallbacks = {
	onEvent: (e: AgentEvent) => void;
};

export function readCatalogToolDataToMarkdown(data: unknown): string | null {
	if (!data || typeof data !== "object") return null;
	const o = data as Record<string, unknown>;
	if (typeof o.content === "string") return o.content;
	if (Array.isArray(o.lines)) {
		return (o.lines as [number, string][]).map((row) => row[1]).join("\n");
	}
	return null;
}

export function parseLineRangeArgs(args: Record<string, unknown>): { lineStart?: number; lineEnd?: number } | null {
	const lineStart = args.lineStart;
	const lineEnd = args.lineEnd;
	if (lineStart === undefined && lineEnd === undefined) return {};
	if (typeof lineStart !== "number" || typeof lineEnd !== "number") return null;
	return { lineStart, lineEnd };
}

export function readLineRange(content: string, lineStart: number, lineEnd: number): string {
	const lines = content.split("\n");
	if (lineEnd < lineStart) return "";
	const start = Math.max(1, lineStart);
	const end = Math.min(lines.length, lineEnd);
	if (start > end) return "";
	return lines.slice(start - 1, end).join("\n");
}

export function buildSimpleLineDiff(before: string, after: string) {
	const beforeLines = before.split("\n");
	const afterLines = after.split("\n");

	let start = 0;
	while (start < beforeLines.length && start < afterLines.length && beforeLines[start] === afterLines[start]) {
		start++;
	}

	let endBefore = beforeLines.length - 1;
	let endAfter = afterLines.length - 1;
	while (endBefore >= start && endAfter >= start && beforeLines[endBefore] === afterLines[endAfter]) {
		endBefore--;
		endAfter--;
	}

	const beforeText = endBefore >= start ? beforeLines.slice(start, endBefore + 1).join("\n") : "";
	const afterText = endAfter >= start ? afterLines.slice(start, endAfter + 1).join("\n") : "";
	if (!beforeText && !afterText) return [];
	return [
		{
			lineStart: start + 1,
			lineCount: endBefore >= start ? endBefore - start + 1 : 0,
			beforeText,
			afterText,
		},
	];
}

export async function buildToolCallPreview(
	name: string,
	args: unknown,
	mcp: ToolSession,
): Promise<unknown | undefined> {
	if (name !== "update_catalog_item") {
		return undefined;
	}

	const raw = (args ?? {}) as Record<string, unknown>;
	const catalogName = String(raw.catalogName ?? "");
	const itemPath = String(raw.itemPath ?? "");
	const after = String(raw.content ?? "");
	const lineRange = parseLineRangeArgs(raw);
	if (lineRange == null) return undefined;
	if (!catalogName || !itemPath) return undefined;

	const current = await mcp.callTool("read_catalog_item", { catalogName, itemPath });
	if (!current.ok) return undefined;

	const before = readCatalogToolDataToMarkdown(current.data);
	if (before == null) return undefined;

	if (lineRange.lineStart !== undefined && lineRange.lineEnd !== undefined) {
		const beforeText = readLineRange(before, lineRange.lineStart, lineRange.lineEnd);
		return {
			type: "update_catalog_item_diff",
			itemPath,
			diff: [
				{
					lineStart: lineRange.lineStart,
					lineCount:
						lineRange.lineEnd >= lineRange.lineStart ? lineRange.lineEnd - lineRange.lineStart + 1 : 0,
					beforeText,
					afterText: after,
				},
			],
		};
	}

	return {
		type: "update_catalog_item_diff",
		itemPath,
		diff: buildSimpleLineDiff(before, after),
	};
}

export async function runAgentTurn(options: {
	sessionId: string;
	userContent: string;
	openItemPath: string | null;
	commands: CommandTree;
	ctx: Context;
	messages: ChatCompletionMessage[];
	mcp: ToolSession;
	policy: ToolCallPolicy;
	callbacks: AgentLoopCallbacks;
	onLlmUsage?: (usage: ChatCompletionUsage) => void;
	signal?: AbortSignal;
}): Promise<void> {
	const { sessionId, userContent, mcp, policy, callbacks, signal, openItemPath, onLlmUsage } = options;
	const messages = options.messages;
	const config = getAgentLlmConfig();
	const maxSteps = config.maxSteps;
	const previewMax = config.toolPreviewMaxChars;
	const push = (e: AgentEvent) => callbacks.onEvent(e);
	const llm = getAgentLlmClient();

	const tools = await mcp.getTools();

	let currentCatalogName: string | undefined;
	let currentItemPath: string | undefined;
	if (openItemPath) {
		const full = new Path(normalizePath(openItemPath));
		const catalog = full.rootDirectory;
		if (catalog.value) {
			const tail = catalog.subDirectory(full);
			if (tail?.value) {
				currentCatalogName = catalog.value;
				currentItemPath = tail.value;
			}
		}
	}
	const systemAppendix = getCurrentContextDescription(currentCatalogName, currentItemPath);
	const fullSystem = `${getSystemPrompt()}${getSkillsDescriptions()}${systemAppendix}`;

	const systemIdx = messages.findIndex((m) => m.role === "system");
	if (systemIdx === -1) {
		messages.unshift({ role: "system", content: fullSystem });
	} else {
		messages[systemIdx] = { role: "system", content: fullSystem };
	}

	messages.push({ role: "user", content: userContent });

	for (let step = 0; step < maxSteps; step++) {
		const streamed = await llm.streamChatIteration(
			messages,
			tools.length ? tools : undefined,
			(piece) => push({ type: "assistant_delta", ts: Date.now(), content: piece }),
			signal,
			onLlmUsage,
		);

		const toolCalls = streamed.tool_calls;
		const textOut = typeof streamed.content === "string" ? streamed.content : "";

		if (!toolCalls?.length && streamed.content == null) {
			push({ type: "error", ts: Date.now(), message: `Empty response from ${llm.providerLabel}` });
			return;
		}

		if (toolCalls?.length) {
			const assistantToolMessage: ChatCompletionMessage = {
				role: "assistant",
				content: streamed.content ?? null,
				tool_calls: toolCalls,
			};
			if (streamed.reasoning_content) {
				assistantToolMessage.reasoning_content = streamed.reasoning_content;
			}
			messages.push(assistantToolMessage);

			for (const tc of toolCalls) {
				await executeOneToolCall({
					tc,
					sessionId,
					mcp,
					policy,
					push,
					messages,
					previewMax,
					content: streamed.content ?? null,
					reasoningContent: streamed.reasoning_content ?? null,
				});
			}
			continue;
		}

		const assistantMessage: ChatCompletionMessage = {
			role: "assistant",
			content: textOut,
		};
		if (streamed.reasoning_content) {
			assistantMessage.reasoning_content = streamed.reasoning_content;
		}
		messages.push(assistantMessage);
		if (textOut || streamed.reasoning_content) {
			push({
				type: "assistant_message",
				ts: Date.now(),
				content: textOut,
				reasoningContent: streamed.reasoning_content,
			});
		}
		push({ type: "turn_completed", ts: Date.now() });
		return;
	}

	push({
		type: "error",
		ts: Date.now(),
		message: `Agent step limit exceeded (${maxSteps})`,
	});
}

async function executeOneToolCall(options: {
	tc: ChatCompletionToolCall;
	sessionId: string;
	mcp: ToolSession;
	policy: ToolCallPolicy;
	push: (e: AgentEvent) => void;
	messages: ChatCompletionMessage[];
	previewMax: number;
	content: string | null;
	reasoningContent: string | null;
}): Promise<void> {
	const { tc, sessionId, mcp, policy, push, messages, previewMax, content, reasoningContent } = options;
	const name = tc.function.name;
	let args: unknown = {};
	const argumentsText = tc.function.arguments ?? "{}";
	try {
		args = argumentsText ? JSON.parse(argumentsText) : {};
	} catch {
		args = { raw: argumentsText };
	}
	const preview = await buildToolCallPreview(name, args, mcp);

	push({
		type: "tool_call_requested",
		ts: Date.now(),
		toolCallId: tc.id,
		name,
		arguments: args,
		content: content,
		reasoningContent,
		preview,
	});

	const decision = await policy.beforeToolCall({
		sessionId,
		toolName: name,
		args,
	});

	if (decision.decision === "pending_approval") {
		push({
			type: "tool_awaiting_confirmation",
			ts: Date.now(),
			correlationId: decision.correlationId,
			toolCallId: tc.id,
			name,
			summary: decision.summary,
		});
		push({
			type: "error",
			ts: Date.now(),
			message: "Tool confirmation is not implemented",
		});
		return;
	}

	const toolResult = await mcp.callTool(name, args);
	const text = toolResult.ok ? JSON.stringify(toolResult.data ?? null, null, 2) : (toolResult.error ?? "");
	const isError = !toolResult.ok;
	const fullLength = text.length;
	const contentPreview =
		text.length <= previewMax ? text : `${text.slice(0, previewMax)}… [truncated, ${text.length} characters total]`;

	push({
		type: "tool_result",
		ts: Date.now(),
		toolCallId: tc.id,
		name,
		content: text,
		contentPreview,
		fullLength,
		isError,
		refreshPage: (toolResult.data as { refreshPage?: unknown } | undefined)?.refreshPage === true,
	});

	messages.push({
		role: "tool",
		tool_call_id: tc.id,
		content: text,
	});
}
