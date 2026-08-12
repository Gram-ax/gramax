import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { useApi, useDeferApi } from "@core-ui/hooks/useApi";
import t from "@ext/localization/locale/translate";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	clearActiveSessionId,
	getActiveSessionId,
	getSessions,
	setApiKey,
	removeSession as storeRemoveSession,
	setActiveSessionId as storeSetActiveSessionId,
	setSessions as storeSetSessions,
	useStoredSessions,
} from "../store/AgentStore";
import { setChatState } from "../store/ChatStore";
import type { SessionStatePayload, SessionTabItem } from "../types/chat";

const LIST_OPTS = { consumeError: true } as const;
const POST_OPTS = {
	method: Method.POST,
	mime: MimeTypes.json,
	consumeError: true,
} as const;

type SessionListResponse = { sessions: SessionStatePayload[] };

let sessionsRestored = false;

export const useAgentSessions = () => {
	const [sessions, setSessions] = useState<SessionTabItem[]>([]);
	const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
	const [sessionLoading, setSessionLoading] = useState(true);
	const [sessionError, setSessionError] = useState<string | null>(null);
	const storedSessions = useStoredSessions();

	useEffect(() => {
		setSessions((prev) => {
			let changed = false;
			const next = prev.map((s) => {
				const stored = storedSessions.find((z) => z.id === s.id);
				if (!stored) return s;
				const events = Array.isArray(stored.events) ? stored.events : [];
				const hasUserMessage = events.some((e) => e.type === "user_message");
				const title = stored.title ?? "";
				if (s.hasUserMessage === hasUserMessage && s.title === title) return s;
				changed = true;
				return { ...s, hasUserMessage, title };
			});
			return changed ? next : prev;
		});
	}, [storedSessions]);

	const { call: callList } = useApi<SessionListResponse>({
		url: (api) => api.getAgentSessionListUrl(),
		opts: LIST_OPTS,
	});
	const { call: callRestore } = useDeferApi<void>({
		url: (api) => api.getAgentSessionRestoreUrl(),
		opts: POST_OPTS,
	});
	const { call: callCreate } = useDeferApi<SessionStatePayload>({
		url: (api) => api.getAgentSessionCreateUrl(),
		opts: POST_OPTS,
	});
	const { call: callDelete } = useDeferApi<void>({ opts: POST_OPTS });

	const activate = useCallback((id: string | null) => {
		setActiveSessionId(id);
		if (id) storeSetActiveSessionId(id);
		else clearActiveSessionId();
	}, []);

	const restoreSessions = useCallback(async () => {
		const activeSessionId = getActiveSessionId();
		await callRestore({
			opts: {
				body: JSON.stringify({
					activeSessionId,
				}),
			},
		});
	}, [callRestore]);

	const fetchSessions = useCallback(async (): Promise<SessionTabItem[]> => {
		try {
			const data = await callList();
			if (data && Array.isArray(data.sessions)) {
				const mappedSessions: SessionTabItem[] = data.sessions
					.flatMap((s) => {
						const id = s.id;
						if (!id) return [];
						const events = Array.isArray(s.events) ? s.events : [];
						const firstUserMessage = events.find((e) => e.type === "user_message");
						const title = s.title ?? "";
						const createdAt = events[0]?.ts ?? Date.now();

						return [
							{
								id,
								title,
								createdAt,
								hasUserMessage: !!firstUserMessage,
							},
						];
					})
					.sort((a, b) => b.createdAt - a.createdAt);

				setSessions(mappedSessions);
				storeSetSessions(data.sessions);
				return mappedSessions;
			}
			return [];
		} finally {
			setSessionLoading(false);
		}
	}, [callList]);

	const createNewSession = useCallback(async (): Promise<string | null> => {
		setSessionLoading(true);
		setSessionError(null);
		try {
			const data = await callCreate({
				opts: { body: JSON.stringify({}) },
			});

			if (!data?.id) {
				setSessionError(t("agent.chat-error.chat-connection-failed"));
				return null;
			}

			const newId = data.id;
			setSessions((prev) =>
				prev.some((s) => s.id === newId)
					? prev
					: [{ id: newId, title: data.title ?? "", createdAt: Date.now(), hasUserMessage: false }, ...prev],
			);
			activate(newId);

			return newId;
		} finally {
			setSessionLoading(false);
		}
	}, [callCreate, activate]);

	const createSession = useCallback(async (): Promise<string | null> => {
		const empty = sessions.find((s) => !s.hasUserMessage);
		if (empty) {
			activate(empty.id);
			return empty.id;
		}
		return createNewSession();
	}, [sessions, createNewSession, activate]);

	const ensureActiveSession = useCallback(
		async (candidateId: string | null) => {
			if (candidateId) activate(candidateId);
			else await createNewSession();
		},
		[activate, createNewSession],
	);

	useEffect(() => {
		const initSessions = async () => {
			const preferredSessionId = getActiveSessionId();
			if (!sessionsRestored) {
				sessionsRestored = true;
				await restoreSessions();
			}
			const restoredSessions = await fetchSessions();
			const resolvedActiveId = restoredSessions.some((session) => session.id === preferredSessionId)
				? preferredSessionId
				: (restoredSessions[0]?.id ?? null);
			await ensureActiveSession(resolvedActiveId);
		};
		void initSessions();
	}, [fetchSessions, restoreSessions, ensureActiveSession]);

	const selectSession = useCallback((id: string) => activate(id), [activate]);

	const deleteSession = useCallback(
		async (id: string) => {
			const prevSessions = sessions;
			const prevStoreSessions = getSessions();
			const prevActiveSessionId = activeSessionId;

			const nextSessions = sessions.filter((s) => s.id !== id);
			const nextActiveId = activeSessionId === id ? (nextSessions[0]?.id ?? null) : activeSessionId;

			storeRemoveSession(id);
			setSessions(nextSessions);

			if (nextActiveId && nextActiveId !== activeSessionId) activate(nextActiveId);

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
				activate(prevActiveSessionId);
				setSessionError(t("agent.chat-error.delete-session-error"));
				return;
			}

			await ensureActiveSession(nextActiveId);
		},
		[activeSessionId, callDelete, ensureActiveSession, sessions, activate],
	);

	const saveApiKey = useCallback(async (key: string) => {
		setApiKey(key);
	}, []);

	const deleteSessionRef = useRef(deleteSession);
	deleteSessionRef.current = deleteSession;
	const saveApiKeyRef = useRef(saveApiKey);
	saveApiKeyRef.current = saveApiKey;
	const createSessionRef = useRef(createSession);
	createSessionRef.current = createSession;

	// biome-ignore lint/correctness/useExhaustiveDependencies: it's ok
	useEffect(() => {
		setChatState({
			onSelectSession: selectSession,
			onNewSession: () => void createSessionRef.current(),
			onCloseTab: (id) => void deleteSessionRef.current(id),
			onSaveSettings: (key) => void saveApiKeyRef.current(key),
		});
	}, []);

	useEffect(() => {
		setChatState({ sessions, activeSessionId, sessionLoading });
	}, [sessions, activeSessionId, sessionLoading]);

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
