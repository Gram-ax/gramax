import type { AgentEvent } from "../core/events";
import type { ChatCompletionMessage } from "./agentLlmChatCompletions";

export function mapAgentEventsToChatCompletionMessages(events: AgentEvent[]): ChatCompletionMessage[] {
	const messages: ChatCompletionMessage[] = [];
	const completedToolCallIds = new Set<string>();
	const includedToolCallIds = new Set<string>();

	for (const event of events) {
		if (event.type === "tool_result") {
			completedToolCallIds.add(event.toolCallId);
		}
	}

	for (const event of events) {
		switch (event.type) {
			case "user_message":
				messages.push({ role: "user", content: event.content });
				break;
			case "assistant_message": {
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
				if (!completedToolCallIds.has(event.toolCallId)) {
					break;
				}
				const assistantToolMessage: ChatCompletionMessage = {
					role: "assistant",
					content: event.content ?? null,
					tool_calls: [
						{
							id: event.toolCallId,
							type: "function",
							function: {
								name: event.name,
								arguments: JSON.stringify(event.arguments ?? {}),
							},
						},
					],
				};
				if (event.reasoningContent) {
					assistantToolMessage.reasoning_content = event.reasoningContent;
				}
				messages.push(assistantToolMessage);
				includedToolCallIds.add(event.toolCallId);
				break;
			}
			case "tool_result":
				if (!includedToolCallIds.has(event.toolCallId)) {
					break;
				}
				messages.push({
					role: "tool",
					tool_call_id: event.toolCallId,
					content: event.content ?? event.contentPreview,
				});
				break;
			default:
				break;
		}
	}

	return messages;
}
