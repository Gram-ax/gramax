import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { useApi, useDeferApi } from "@core-ui/hooks/useApi";
import type { AgentSession } from "@ext/agent/core/sessionStore";
import t from "@ext/localization/locale/translate";
import { useCallback, useEffect, useState } from "react";
import type { SessionTabItem } from "../panel/ChatHeader";
import {
	clearActiveSessionId,
	getActiveSessionId,
	getApiKey,
	getSessions,
	type SessionStatePayload,
	setApiKey,
	removeSession as storeRemoveSession,
	setActiveSessionId as storeSetActiveSessionId,
	setSessions as storeSetSessions,
} from "../store/AgentStore";

const LIST_OPTS = { consumeError: true } as const;
const POST_OPTS = {
	method: Method.POST,
	mime: MimeTypes.json,
	consumeError: true,
} as const;

type SessionListResponse = { sessions: SessionStatePayload[] };
type SessionCreateResponse = { sessionId?: string };

export const useAgentSessions = () => {
	const [sessions, setSessions] = useState<SessionTabItem[]>([]);
	const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
	const [sessionLoading, setSessionLoading] = useState(true);
	const [sessionError, setSessionError] = useState<string | null>(null);
	const [initialized, setInitialized] = useState(false);

	const { call: callList } = useApi<SessionListResponse>({
		url: (api) => api.getAgentSessionListUrl(),
		opts: LIST_OPTS,
	});
	const { call: callRestore } = useDeferApi<void>({
		url: (api) => api.getAgentSessionRestoreUrl(),
		opts: POST_OPTS,
	});
	const { call: callCreate } = useDeferApi<SessionCreateResponse>({
		url: (api) => api.getAgentSessionCreateUrl(),
		opts: POST_OPTS,
	});
	const { call: callDelete } = useDeferApi<void>({ opts: POST_OPTS });

	const toAgentSession = useCallback((session: SessionStatePayload): AgentSession | null => {
		if (!session.sessionId) return null;
		return {
			id: session.sessionId,
			openItemPath: session.openItemPath ?? null,
			cancelled: !!session.cancelled,
			runChain: Promise.resolve(),
			activeRunController: null,
			processing: !!session.processing,
			lastError: session.lastError ?? null,
			events: Array.isArray(session.events) ? (session.events as AgentSession["events"]) : [],
			usage: session.usage,
		};
	}, []);

	const restoreSessions = useCallback(
		async (sessionsSnapshot: SessionStatePayload[], preferredSessionId?: string | null) => {
			if (!sessionsSnapshot.length) return;
			const restoredSessions = sessionsSnapshot
				.map(toAgentSession)
				.filter((session): session is AgentSession => !!session);
			if (!restoredSessions.length) return;
			await callRestore({
				opts: {
					body: JSON.stringify({
						sessions: restoredSessions,
						activeSessionId: preferredSessionId ?? null,
						apiKey: getApiKey(),
					}),
				},
			});
		},
		[callRestore, toAgentSession],
	);

	const fetchSessions = useCallback(async (): Promise<SessionTabItem[]> => {
		try {
			const data = await callList();
			if (data && Array.isArray(data.sessions)) {
				const mappedSessions = data.sessions.map((s) => {
					const events = Array.isArray(s.events) ? s.events : [];
					const firstUserMessage = events.find((e) => e.type === "user_message");
					const title =
						firstUserMessage?.type === "user_message"
							? firstUserMessage.content
							: t("agent.history.new-chat");
					const createdAt = events[0]?.ts ?? Date.now();

					return {
						id: s.sessionId,
						title,
						createdAt,
					};
				});

				setSessions(mappedSessions);
				storeSetSessions(data.sessions);
				return mappedSessions;
			}
			return [];
		} finally {
			setInitialized(true);
			setSessionLoading(false);
		}
	}, [callList]);

	useEffect(() => {
		const initSessions = async () => {
			const preferredSessionId = getActiveSessionId();
			await restoreSessions(getSessions(), preferredSessionId);
			const restoredSessions = await fetchSessions();
			const resolvedActiveId = restoredSessions.some((session) => session.id === preferredSessionId)
				? preferredSessionId
				: restoredSessions[0]?.id;
			if (resolvedActiveId) {
				setActiveSessionId(resolvedActiveId);
				storeSetActiveSessionId(resolvedActiveId);
			} else {
				setActiveSessionId(null);
				clearActiveSessionId();
			}
		};
		void initSessions();
	}, [fetchSessions, restoreSessions]);

	const createSession = useCallback(async (): Promise<string | null> => {
		setSessionLoading(true);
		setSessionError(null);
		try {
			const data = await callCreate({
				opts: { body: JSON.stringify({ apiKey: getApiKey() }) },
			});

			if (!data?.sessionId) {
				setSessionError(t("agent.chat-error.chat-connection-failed"));
				return null;
			}

			const newSession: SessionTabItem = {
				id: data.sessionId,
				createdAt: Date.now(),
			};

			setSessions((prev) => [newSession, ...prev]);
			setActiveSessionId(data.sessionId);
			storeSetActiveSessionId(data.sessionId);

			return data.sessionId;
		} finally {
			setSessionLoading(false);
		}
	}, [callCreate]);

	const selectSession = useCallback((id: string) => {
		setActiveSessionId(id);
		storeSetActiveSessionId(id);
	}, []);

	const deleteSession = useCallback(
		async (id: string) => {
			const prevSessions = sessions;
			const prevStoreSessions = getSessions();
			const prevActiveSessionId = activeSessionId;

			const nextSessions = sessions.filter((s) => s.id !== id);
			const nextActiveId = activeSessionId === id ? (nextSessions[0]?.id ?? null) : activeSessionId;

			storeRemoveSession(id);
			setSessions(nextSessions);

			if (nextActiveId !== activeSessionId) {
				setActiveSessionId(nextActiveId);
				if (nextActiveId) storeSetActiveSessionId(nextActiveId);
				else clearActiveSessionId();
			}

			let failed = false;
			await callDelete({
				url: (api) => api.getAgentSessionDeleteUrl(id),
				onError: () => {
					failed = true;
				},
			});

			if (failed) {
				setSessions(prevSessions);
				storeSetSessions(prevStoreSessions);
				if (prevActiveSessionId) {
					setActiveSessionId(prevActiveSessionId);
					storeSetActiveSessionId(prevActiveSessionId);
				} else {
					setActiveSessionId(null);
					clearActiveSessionId();
				}
				setSessionError(t("agent.chat-error.delete-session-error"));
			}
		},
		[activeSessionId, callDelete, sessions],
	);

	useEffect(() => {
		if (initialized && sessions.length === 0 && !sessionLoading) {
			void createSession();
		}
	}, [initialized, sessions.length, sessionLoading, createSession]);

	const saveApiKey = useCallback(
		async (key: string) => {
			setApiKey(key);
			await restoreSessions(getSessions(), activeSessionId);
		},
		[activeSessionId, restoreSessions],
	);

	return {
		sessions,
		activeSessionId,
		sessionLoading,
		sessionError,
		createSession,
		selectSession,
		removeSession: deleteSession,
		saveApiKey,
	};
};
