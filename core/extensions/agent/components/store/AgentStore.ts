import type { SessionStatePayload } from "@ext/agent/components/types/chat";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AgentStoreState {
	activeSessionId: string | null;
	sessions: SessionStatePayload[];
	apiKey: string | null;
	setActiveSessionId: (id: string) => void;
	clearActiveSessionId: () => void;
	setSessions: (sessions: SessionStatePayload[]) => void;
	upsertSession: (session: SessionStatePayload) => void;
	removeSession: (id: string) => void;
	setApiKey: (key: string) => void;
	clearApiKey: () => void;
}

const useAgentStore = create<AgentStoreState>()(
	persist(
		(set) => ({
			activeSessionId: null,
			sessions: [],
			apiKey: null,
			setActiveSessionId: (id) => set({ activeSessionId: id }),
			clearActiveSessionId: () => set({ activeSessionId: null }),
			setSessions: (sessions) => set({ sessions }),
			upsertSession: (session) =>
				set((state) => ({
					sessions: [...state.sessions.filter((s) => s.id !== session.id), session],
				})),
			removeSession: (id) => set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
			setApiKey: (key) => set({ apiKey: key }),
			clearApiKey: () => set({ apiKey: null }),
		}),
		{
			name: "agent-state",
			partialize: (s) => ({ activeSessionId: s.activeSessionId, apiKey: s.apiKey }),
		},
	),
);

export const useApiKey = () => useAgentStore((s) => s.apiKey);
export const useStoredSessions = () => useAgentStore((s) => s.sessions);
export const useActiveSessionId = () => useAgentStore((s) => s.activeSessionId);
export const useActiveSessionUsage = () =>
	useAgentStore((s) => s.sessions.find((sess) => sess.id === s.activeSessionId)?.usage);
export const useActiveSessionBrowser = () =>
	useAgentStore((s) => s.sessions.find((sess) => sess.id === s.activeSessionId)?.browser);

export const getActiveSessionId = () => useAgentStore.getState().activeSessionId;
export const getSessions = () => useAgentStore.getState().sessions;
export const getApiKey = () => useAgentStore.getState().apiKey;

export const setActiveSessionId = (id: string) => useAgentStore.getState().setActiveSessionId(id);
export const clearActiveSessionId = () => useAgentStore.getState().clearActiveSessionId();
export const setSessions = (sessions: SessionStatePayload[]) => useAgentStore.getState().setSessions(sessions);
export const upsertSession = (session: SessionStatePayload) => useAgentStore.getState().upsertSession(session);
export const removeSession = (id: string) => useAgentStore.getState().removeSession(id);
export const setApiKey = (key: string) => useAgentStore.getState().setApiKey(key);
export const clearApiKey = () => useAgentStore.getState().clearApiKey();
