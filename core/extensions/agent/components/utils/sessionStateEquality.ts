import type { AgentEvent } from "@ext/agent/core/events";
import type { AgentUsage } from "@ext/agent/core/session";
import type { SessionStatePayload } from "../types/chat";

const isAgentUsageEqual = (a: AgentUsage | undefined, b: AgentUsage | undefined): boolean => {
	if (a === b) return true;
	if (!a || !b) return !a && !b;
	return (
		a.totalUsage === b.totalUsage &&
		a.lastTurnUsage === b.lastTurnUsage &&
		a.contextTokensUsed === b.contextTokensUsed &&
		a.contextWindowTokens === b.contextWindowTokens &&
		a.contextUsagePercent === b.contextUsagePercent
	);
};

const eventSnapshotSignature = (event: AgentEvent): string => {
	switch (event.type) {
		case "user_message":
		case "assistant_delta":
		case "assistant_message":
			return `${event.type}|${event.ts}|${event.content.length}`;
		case "tool_call_requested":
			return `${event.type}|${event.ts}|${event.toolCallId}`;
		case "tool_result":
			return `${event.type}|${event.ts}|${event.toolCallId}|${event.contentPreview.length}|${event.isError}`;
		case "error":
			return `${event.type}|${event.ts}|${event.message}|${event.errorType}`;
		case "tool_awaiting_confirmation":
			return `${event.type}|${event.ts}|${event.correlationId}`;
		case "turn_finished":
			return `${event.type}|${event.ts}|${event.status}|${!!event.refreshPage}`;
		default:
			return `${event.type}|${event.ts}`;
	}
};

export const isSessionStatePayloadEqual = (prev: SessionStatePayload, next: SessionStatePayload): boolean => {
	if (prev.id !== next.id) return false;
	if (prev.title !== next.title) return false;
	if (!!prev.processing !== !!next.processing) return false;
	if (!!prev.cancelled !== !!next.cancelled) return false;
	if (prev.lastError !== next.lastError) return false;
	if (prev.error !== next.error) return false;
	if (prev.openCatalogName !== next.openCatalogName) return false;
	if (prev.openItemPath !== next.openItemPath) return false;
	if (!!prev.browser?.active !== !!next.browser?.active) return false;
	if (!!prev.browser?.visible !== !!next.browser?.visible) return false;
	if (!isAgentUsageEqual(prev.usage, next.usage)) return false;

	const prevEvents = prev.events ?? [];
	const nextEvents = next.events ?? [];
	if (prevEvents.length !== nextEvents.length) return false;
	if (prevEvents.length === 0) return true;

	const lastPrev = prevEvents[prevEvents.length - 1];
	const lastNext = nextEvents[nextEvents.length - 1];
	return eventSnapshotSignature(lastPrev) === eventSnapshotSignature(lastNext);
};
