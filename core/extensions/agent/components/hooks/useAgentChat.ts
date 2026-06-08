import { useAgentSender } from "./useAgentSender";
import { useAgentSession } from "./useAgentSession";
import { useAgentTimeline } from "./useAgentTimeline";
import { useSessionPolling } from "./useSessionPolling";

export const useAgentChat = (sessionId: string | null, openItemPath?: string) => {
	const { timeline, awaitingAgentEvent, setAwaitingAgentEvent, applyEvents, appendError, reset } = useAgentTimeline();

	const { start: startPolling, stop: stopPolling } = useSessionPolling();

	const { sessionLoading, sessionError, fetchSessionState, flushSessionEvents } = useAgentSession({
		sessionId,
		openItemPath,
		applyEvents,
		resetTimeline: reset,
		stopPolling,
	});

	const { draft, setDraft, send, cancel, sending } = useAgentSender({
		sessionId,
		openItemPath,
		fetchSessionState,
		flushSessionEvents,
		startPolling,
		stopPolling,
		appendError,
		setAwaitingAgentEvent,
	});

	return {
		timeline,
		draft,
		setDraft,
		send,
		cancel,
		sending,
		sessionLoading,
		sessionError,
		awaitingAgentEvent,
	};
};
