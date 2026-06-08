import { type AgentTimelineEntry, isPlainObject } from "@ext/agent/components/utils/agentTimeline";
import type { AgentEvent } from "@ext/agent/core/events";
import t from "@ext/localization/locale/translate";

function isWhitespaceOnlyContent(content: string): boolean {
	return content.trim().length === 0;
}

function findLastMeaningfulEntryIndex(entries: AgentTimelineEntry[]): number {
	for (let i = entries.length - 1; i >= 0; i--) {
		const entry = entries[i];
		if (entry.kind !== "message") return i;
		if (entry.content.trim().length > 0) return i;
	}
	return -1;
}

export function hasAgentResponseEvent(events: AgentEvent[]): boolean {
	return events.some(
		(e) =>
			e.type === "assistant_delta" ||
			e.type === "assistant_message" ||
			e.type === "tool_call_requested" ||
			e.type === "tool_result" ||
			e.type === "error",
	);
}

export function hasRefreshPageEvent(events: AgentEvent[]): boolean {
	return events.some((e) => e.type === "tool_result" && e.refreshPage === true);
}

export function reduceTimeline(prev: AgentTimelineEntry[], incoming: AgentEvent[]): AgentTimelineEntry[] {
	const next = [...prev];
	for (const e of incoming) {
		switch (e.type) {
			case "user_message":
				next.push({
					kind: "message",
					role: "user",
					content: e.content,
					ts: e.ts,
				});
				break;
			case "assistant_delta": {
				const last = next.at(-1);
				const contentIsWhitespaceOnly = isWhitespaceOnlyContent(e.content);
				if (last?.kind === "message" && last.role === "assistant" && last.streaming) {
					next[next.length - 1] = { ...last, content: last.content + e.content, ts: e.ts };
				} else {
					const lastMeaningfulEntryIndex = findLastMeaningfulEntryIndex(next);
					const lastMeaningfulEntry =
						lastMeaningfulEntryIndex >= 0 ? next[lastMeaningfulEntryIndex] : undefined;
					const isWhitespaceBetweenToolEntries =
						contentIsWhitespaceOnly &&
						(lastMeaningfulEntry?.kind === "tool_call" || lastMeaningfulEntry?.kind === "tool_result");
					if (isWhitespaceBetweenToolEntries) {
						break;
					}
					next.push({
						kind: "message",
						role: "assistant",
						content: e.content,
						ts: e.ts,
						streaming: true,
					});
				}
				break;
			}
			case "assistant_message": {
				const last = next.at(-1);
				if (last?.kind === "message" && last.role === "assistant" && last.streaming) {
					next[next.length - 1] = { ...last, content: e.content, streaming: false, ts: e.ts };
				} else {
					next.push({
						kind: "message",
						role: "assistant",
						content: e.content,
						ts: e.ts,
					});
				}
				break;
			}
			case "tool_call_requested":
				next.push({
					kind: "tool_call",
					ts: e.ts,
					name: e.name,
					toolCallId: e.toolCallId,
					arguments: isPlainObject(e.arguments) ? e.arguments : {},
					preview: e.preview,
				});
				break;
			case "tool_result":
				next.push({
					kind: "tool_result",
					ts: e.ts,
					name: e.name,
					toolCallId: e.toolCallId,
					contentPreview: e.contentPreview,
					fullLength: e.fullLength,
					isError: e.isError,
				});
				break;
			case "error":
				next.push({
					kind: "error",
					ts: e.ts,
					message: t("agent.chat-error.agent-failed"),
				});
				break;
			case "turn_completed": {
				const last = next.at(-1);
				if (last?.kind === "message" && last.role === "assistant" && last.streaming) {
					next[next.length - 1] = { ...last, streaming: false };
				}
				break;
			}
			default:
				break;
		}
	}
	return next;
}
