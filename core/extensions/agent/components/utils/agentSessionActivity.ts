import type { SessionStatePayload } from "@ext/agent/components/types/chat";
import type { AgentEvent } from "@ext/agent/core/events";

export type AgentSessionSnapshot = {
	eventCount: number;
	lastEventType: AgentEvent["type"] | null;
	processing: boolean;
};

export const snapshotAgentSession = (state: SessionStatePayload | null): AgentSessionSnapshot => {
	const events = state?.events ?? [];
	const last = events.at(-1);
	return {
		eventCount: events.length,
		lastEventType: last?.type ?? null,
		processing: !!state?.processing,
	};
};

export const shouldShowAgentThinkingSpinner = (
	current: AgentSessionSnapshot,
	options?: { isSending?: boolean },
): boolean => {
	if (current.lastEventType === "turn_finished" || current.lastEventType === "error") {
		return false;
	}
	return !!(current.processing || options?.isSending);
};
