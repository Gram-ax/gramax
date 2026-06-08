import type { AgentEvent } from "@ext/agent/core/events";
import type { AgentUsage } from "@ext/agent/core/sessionStore";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SessionStatePayload = {
	sessionId?: string;
	error?: string;
	processing?: boolean;
	events?: AgentEvent[];
	openItemPath?: string | null;
	cancelled?: boolean;
	lastError?: string | null;
	usage?: AgentUsage;
};

interface AgentStoreState {
	activeSessionId: string | null;
	sessions: SessionStatePayload[];
	apiKey: string | null;
	setActiveSessionId: (id: string) => void;
	clearActiveSessionId: () => void;
	setSessions: (sessions: SessionStatePayload[]) => void;
	upsertSession: (session: SessionStatePayload) => void;
	removeSession: (sessionId: string) => void;
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
					sessions: [...state.sessions.filter((s) => s.sessionId !== session.sessionId), session],
				})),
			removeSession: (sessionId) =>
				set((state) => ({ sessions: state.sessions.filter((s) => s.sessionId !== sessionId) })),
			setApiKey: (key) => set({ apiKey: key }),
			clearApiKey: () => set({ apiKey: null }),
		}),
		{
			name: "agent-state",
			partialize: (s) => ({ activeSessionId: s.activeSessionId, sessions: s.sessions, apiKey: s.apiKey }),
		},
	),
);

export const useApiKey = () => useAgentStore((s) => s.apiKey);

export const getActiveSessionId = () => useAgentStore.getState().activeSessionId;
export const getSessions = () => useAgentStore.getState().sessions;
export const getApiKey = () => useAgentStore.getState().apiKey;

export const setActiveSessionId = (id: string) => useAgentStore.getState().setActiveSessionId(id);
export const clearActiveSessionId = () => useAgentStore.getState().clearActiveSessionId();
export const setSessions = (sessions: SessionStatePayload[]) => useAgentStore.getState().setSessions(sessions);
export const upsertSession = (session: SessionStatePayload) => useAgentStore.getState().upsertSession(session);
export const removeSession = (sessionId: string) => useAgentStore.getState().removeSession(sessionId);
export const setApiKey = (key: string) => useAgentStore.getState().setApiKey(key);
export const clearApiKey = () => useAgentStore.getState().clearApiKey();
