import type { AgentTimelineEntry } from "@ext/agent/components/utils/agentTimeline";
import { hasAgentResponseEvent, reduceTimeline } from "@ext/agent/components/utils/agentTimelineReducer";
import { AgentErrorType } from "@ext/agent/core/agentError";
import type { AgentEvent } from "@ext/agent/core/events";
import { useCallback, useState } from "react";

export const useAgentTimeline = () => {
	const [timeline, setTimeline] = useState<AgentTimelineEntry[]>([]);
	const [awaitingAgentEvent, setAwaitingAgentEvent] = useState(false);

	const applyEvents = useCallback((incoming: AgentEvent[]) => {
		if (!incoming.length) return;
		if (hasAgentResponseEvent(incoming)) setAwaitingAgentEvent(false);
		setTimeline((prev) => reduceTimeline(prev, incoming));
	}, []);

	const replaceEvents = useCallback((incoming: AgentEvent[]) => {
		if (hasAgentResponseEvent(incoming)) setAwaitingAgentEvent(false);
		setTimeline(reduceTimeline([], incoming));
	}, []);

	const appendError = useCallback((message: string) => {
		setTimeline((prev) => [
			...prev,
			{ kind: "error", ts: Date.now(), message, errorType: AgentErrorType.Unexpected },
		]);
	}, []);

	const reset = useCallback(() => {
		setTimeline([]);
		setAwaitingAgentEvent(false);
	}, []);

	return {
		timeline,
		awaitingAgentEvent,
		setAwaitingAgentEvent,
		applyEvents,
		replaceEvents,
		appendError,
		reset,
	};
};
