import type { CommandTree } from "@app/commands";
import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type { AgentEvent } from "../core/events";
import type { ToolDefinition } from "../mcp/tool";
import { getAgentSkills, getSystemPrompt, getUserMessage } from "../prompts";
import type { ChatCompletionMessage, ChatCompletionToolDefinition } from "./agentLlmContracts";

export class AgentLlmEventMapper {
	toolsToLlmFormat(tools: ToolDefinition[]): ChatCompletionToolDefinition[] {
		return tools.map((tool) => ({
			type: "function" as const,
			function: {
				name: tool.name,
				description: tool.description,
				parameters: {
					type: "object",
					properties: tool.inputSchema.properties ?? {},
					...(tool.inputSchema.required?.length ? { required: tool.inputSchema.required } : {}),
					additionalProperties: tool.inputSchema.additionalProperties ?? false,
				},
			},
		}));
	}

	async eventsToMessages(
		app: Application,
		ctx: Context,
		commands: CommandTree,
		events: AgentEvent[],
		catalogName?: string,
	): Promise<ChatCompletionMessage[]> {
		const skills = catalogName ? await getAgentSkills(app, ctx, commands, catalogName) : undefined;
		const browserAllowed =
			[...events]
				.reverse()
				.find((event): event is Extract<AgentEvent, { type: "user_message" }> => event.type === "user_message")
				?.browserAllowed ?? false;
		const messages: ChatCompletionMessage[] = [
			{
				role: "system",
				content: await getSystemPrompt(app, ctx, commands, catalogName, skills, browserAllowed),
			},
		];
		const partialAssistantByTurn = new Map<string, string>();
		let toolStepText: string | null = null;
		let toolStepReasoning: string | undefined;
		let toolStepCallIds: string[] = [];

		const flushToolStep = () => {
			const toolCalls = [];
			for (const toolCallId of toolStepCallIds) {
				const request = events.find(
					(e): e is Extract<AgentEvent, { type: "tool_call_requested" }> =>
						e.type === "tool_call_requested" && e.toolCallId === toolCallId,
				);
				const result = events.find(
					(e): e is Extract<AgentEvent, { type: "tool_result" }> =>
						e.type === "tool_result" && e.toolCallId === toolCallId,
				);
				if (!request || !result) continue;
				toolCalls.push({ request, result });
			}
			if (!toolCalls.length) {
				toolStepText = null;
				toolStepReasoning = undefined;
				toolStepCallIds = [];
				return;
			}
			const assistantToolMessage: ChatCompletionMessage = {
				role: "assistant",
				content: toolStepText,
				tool_calls: toolCalls.map(({ request }) => ({
					id: request.toolCallId,
					type: "function" as const,
					function: {
						name: request.name,
						arguments: JSON.stringify(request.arguments ?? {}),
					},
				})),
			};
			if (toolStepReasoning) {
				assistantToolMessage.reasoning_content = toolStepReasoning;
			}
			messages.push(assistantToolMessage);
			for (const { result } of toolCalls) {
				messages.push({
					role: "tool",
					tool_call_id: result.toolCallId,
					content: result.content ?? result.contentPreview,
				});
			}
			toolStepText = null;
			toolStepReasoning = undefined;
			toolStepCallIds = [];
		};

		for (let i = 0; i < events.length; i++) {
			const event = events[i];
			switch (event.type) {
				case "user_message":
					flushToolStep();
					messages.push({
						role: "user",
						content: await getUserMessage(app, ctx, commands, event, skills),
					});
					break;
				case "assistant_delta":
					partialAssistantByTurn.set(
						event.turnId,
						(partialAssistantByTurn.get(event.turnId) ?? "") + event.content,
					);
					break;
				case "turn_finished": {
					flushToolStep();
					const partial = partialAssistantByTurn.get(event.turnId);
					if (partial?.trim()) {
						messages.push({ role: "assistant", content: partial });
					}
					partialAssistantByTurn.delete(event.turnId);
					break;
				}
				case "assistant_message": {
					partialAssistantByTurn.delete(event.turnId);
					let followedByToolCalls = false;
					for (let j = i + 1; j < events.length; j++) {
						const next = events[j];
						if (next.turnId !== event.turnId) break;
						if (
							next.type === "user_message" ||
							next.type === "turn_finished" ||
							next.type === "assistant_message"
						) {
							break;
						}
						if (
							next.type === "tool_call_requested" &&
							events.some((e) => e.type === "tool_result" && e.toolCallId === next.toolCallId)
						) {
							followedByToolCalls = true;
							break;
						}
					}
					if (followedByToolCalls) {
						flushToolStep();
						toolStepText = event.content || null;
						toolStepReasoning = event.reasoningContent;
						toolStepCallIds = [];
						break;
					}
					flushToolStep();
					const assistantMessage: ChatCompletionMessage = {
						role: "assistant",
						content: event.content,
					};
					if (event.reasoningContent) {
						assistantMessage.reasoning_content = event.reasoningContent;
					}
					messages.push(assistantMessage);
					break;
				}
				case "tool_call_requested": {
					const hasResult = events.some((e) => e.type === "tool_result" && e.toolCallId === event.toolCallId);
					if (!hasResult) break;
					partialAssistantByTurn.delete(event.turnId);
					toolStepCallIds.push(event.toolCallId);
					break;
				}
				case "tool_result": {
					const hasCall = events.some(
						(e) => e.type === "tool_call_requested" && e.toolCallId === event.toolCallId,
					);
					if (!hasCall || toolStepCallIds.includes(event.toolCallId)) break;
					messages.push({
						role: "tool",
						tool_call_id: event.toolCallId,
						content: event.content ?? event.contentPreview,
					});
					break;
				}
				default:
					break;
			}
		}

		flushToolStep();

		return messages;
	}

	messagesToEvents(turnId: string, messages: ChatCompletionMessage[], ts = Date.now()): AgentEvent[] {
		const events: AgentEvent[] = [];
		let nextTs = ts;

		for (let i = 0; i < messages.length; i++) {
			const message = messages[i];
			if (message.role === "system" || message.role === "tool") continue;

			if (message.role === "user") {
				events.push({
					type: "user_message",
					turnId,
					ts: nextTs++,
					content: message.content,
				});
				continue;
			}

			const content = typeof message.content === "string" ? message.content : "";

			if (message.tool_calls?.length) {
				if (content || message.reasoning_content) {
					events.push({
						type: "assistant_message",
						turnId,
						ts: nextTs++,
						content,
						reasoningContent: message.reasoning_content ?? undefined,
					});
				}

				const toolMessages: Extract<ChatCompletionMessage, { role: "tool" }>[] = [];
				let j = i + 1;
				while (j < messages.length && messages[j].role === "tool") {
					toolMessages.push(messages[j] as Extract<ChatCompletionMessage, { role: "tool" }>);
					j++;
				}

				for (const tc of message.tool_calls) {
					const argumentsText = tc.function.arguments ?? "{}";
					let args: unknown;
					try {
						args = argumentsText ? JSON.parse(argumentsText) : {};
					} catch {
						args = { raw: argumentsText };
					}

					events.push({
						type: "tool_call_requested",
						turnId,
						ts: nextTs++,
						toolCallId: tc.id,
						name: tc.function.name,
						arguments: args,
					});

					const toolMessage = toolMessages.find((m) => m.tool_call_id === tc.id);
					if (!toolMessage) continue;

					events.push({
						type: "tool_result",
						turnId,
						ts: nextTs++,
						toolCallId: tc.id,
						name: tc.function.name,
						content: toolMessage.content,
						contentPreview: toolMessage.content,
						fullLength: toolMessage.content.length,
						isError: false,
					});
				}

				i = j - 1;
				continue;
			}

			if (!content && !message.reasoning_content) continue;

			events.push({
				type: "assistant_message",
				turnId,
				ts: nextTs++,
				content,
				reasoningContent: message.reasoning_content ?? undefined,
			});
		}

		return events;
	}
}
