import { refreshPage } from "@core-ui/utils/initGlobalFuncs";
import type { AgentTimelineEntry } from "@ext/agent/components/utils/agentTimeline";
import {
	hasAgentResponseEvent,
	hasRefreshPageEvent,
	reduceTimeline,
} from "@ext/agent/components/utils/agentTimelineReducer";
import type { AgentEvent } from "@ext/agent/core/events";
import { useCallback, useState } from "react";

export const useAgentTimeline = () => {
	const [timeline, setTimeline] = useState<AgentTimelineEntry[]>([]);
	const [awaitingAgentEvent, setAwaitingAgentEvent] = useState(false);

	const applyEvents = useCallback((incoming: AgentEvent[]) => {
		if (!incoming.length) return;
		if (hasAgentResponseEvent(incoming)) setAwaitingAgentEvent(false);
		setTimeline((prev) => reduceTimeline(prev, incoming));
		if (hasRefreshPageEvent(incoming)) void refreshPage();
	}, []);

	const appendError = useCallback((message: string) => {
		setTimeline((prev) => [...prev, { kind: "error", ts: Date.now(), message }]);
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
		appendError,
		reset,
	};
};
