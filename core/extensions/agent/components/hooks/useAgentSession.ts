import { useApi } from "@core-ui/hooks/useApi";
import type { AgentEvent } from "@ext/agent/core/events";
import t from "@ext/localization/locale/translate";
import { useCallback, useEffect, useRef, useState } from "react";
import { type SessionStatePayload, upsertSession } from "../store/AgentStore";

const SESSION_STATE_OPTS = { consumeError: true } as const;

type Args = {
	sessionId: string | null;
	openItemPath?: string;
	applyEvents: (events: AgentEvent[]) => void;
	resetTimeline: () => void;
	stopPolling: () => void;
};

export const useAgentSession = ({ sessionId, openItemPath, applyEvents, resetTimeline, stopPolling }: Args) => {
	const [sessionLoading, setSessionLoading] = useState(false);
	const [sessionError, setSessionError] = useState<string | null>(null);
	const processedEventsRef = useRef(0);

	const { call: callSessionState } = useApi<SessionStatePayload>({
		url: (api) => {
			const u = api.getAgentSessionStateUrl(sessionId ?? "");
			u.query = { ...(u.query ?? {}), openItemPath: openItemPath ?? "" };
			return u;
		},
		opts: SESSION_STATE_OPTS,
	});

	const fetchSessionState = useCallback(async (): Promise<SessionStatePayload | null> => {
		if (!sessionId) return null;
		const result = await callSessionState();
		return result ?? null;
	}, [callSessionState, sessionId]);

	const flushSessionEvents = useCallback(
		(data: SessionStatePayload | null) => {
			if (!data || data.error) return;
			if (data.events?.length) {
				const from = processedEventsRef.current;
				const nextEvents = data.events.slice(from);
				processedEventsRef.current = data.events.length;
				applyEvents(nextEvents);
			}
			upsertSession(data);
		},
		[applyEvents],
	);

	useEffect(() => {
		stopPolling();

		if (!sessionId) {
			resetTimeline();
			return;
		}

		setSessionLoading(true);
		setSessionError(null);
		processedEventsRef.current = 0;
		resetTimeline();

		fetchSessionState()
			.then((state) => {
				if (state) flushSessionEvents(state);
			})
			.catch(() => {
				setSessionError(t("agent.chat-error.load-history-error"));
			})
			.finally(() => {
				setSessionLoading(false);
			});
	}, [sessionId, fetchSessionState, flushSessionEvents, resetTimeline, stopPolling]);

	return { sessionLoading, sessionError, fetchSessionState, flushSessionEvents };
};
