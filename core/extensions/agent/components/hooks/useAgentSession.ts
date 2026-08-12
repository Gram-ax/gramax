import { useApi } from "@core-ui/hooks/useApi";
import type { AgentEvent } from "@ext/agent/core/events";
import t from "@ext/localization/locale/translate";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSessions, upsertSession } from "../store/AgentStore";
import type { SessionStatePayload } from "../types/chat";
import { isSessionStatePayloadEqual } from "../utils/sessionStateEquality";

const SESSION_STATE_OPTS = { consumeError: true } as const;

type Args = {
	sessionId: string | null;
	openCatalogName: string | null;
	openItemPath: string | null;
	applyEvents: (events: AgentEvent[]) => void;
	replaceEvents: (events: AgentEvent[]) => void;
	resetTimeline: () => void;
	stopPolling: () => void;
};

export const useAgentSession = ({
	sessionId,
	openCatalogName,
	openItemPath,
	applyEvents,
	replaceEvents,
	resetTimeline,
	stopPolling,
}: Args) => {
	const [sessionLoading, setSessionLoading] = useState(false);
	const [sessionError, setSessionError] = useState<string | null>(null);
	const processedEventsRef = useRef(0);
	const activeSessionIdRef = useRef(sessionId);
	activeSessionIdRef.current = sessionId;

	const { call: callSessionState } = useApi<SessionStatePayload>({
		url: (api) => {
			const u = api.getAgentSessionStateUrl(sessionId ?? "");
			u.query = { ...(u.query ?? {}), openCatalogName, openItemPath };
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
		(data: SessionStatePayload | null): AgentEvent[] => {
			if (!data || data.error) return [];
			if (data.id && data.id !== activeSessionIdRef.current) return [];

			const events = data.events ?? [];
			const from = processedEventsRef.current;
			const nextEvents = events.slice(from);
			processedEventsRef.current = events.length;

			if (from === 0) {
				replaceEvents(nextEvents);
			} else if (nextEvents.length) {
				applyEvents(nextEvents);
			}
			const prev = getSessions().find((s) => s.id === data.id);
			if (prev && isSessionStatePayloadEqual(prev, data)) return nextEvents;
			upsertSession(data);
			return nextEvents;
		},
		[applyEvents, replaceEvents],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reload only when session changes
	useEffect(() => {
		stopPolling();

		if (!sessionId) {
			resetTimeline();
			setSessionLoading(false);
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
	}, [sessionId]);

	return { sessionLoading, sessionError, fetchSessionState, flushSessionEvents };
};
