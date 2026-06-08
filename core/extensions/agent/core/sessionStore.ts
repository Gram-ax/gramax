import type { AgentEvent } from "./events";

export type AgentUsage = {
	totalUsage: number;
	lastTurnUsage: number;
	contextUsagePercent: number;
};

export type AgentSession = {
	id: string;
	openItemPath: string | null;
	cancelled: boolean;
	runChain: Promise<void>;
	activeRunController: AbortController | null;
	processing: boolean;
	lastError: string | null;
	events: AgentEvent[];
	usage: AgentUsage;
};

const sessions = new Map<string, AgentSession>();

export function addSessionUsage(
	session: AgentSession,
	prompt_tokens_usage: number,
	total_tokens_usage: number,
	contextWindowTokens: number | null,
): void {
	session.usage.totalUsage += total_tokens_usage;
	session.usage.lastTurnUsage += total_tokens_usage;

	if (prompt_tokens_usage > 0 && contextWindowTokens && contextWindowTokens > 0) {
		const percent = (prompt_tokens_usage / contextWindowTokens) * 100;
		session.usage.contextUsagePercent = Math.max(0, Math.min(100, percent));
	}
}

export function createAgentSession(): AgentSession {
	const id =
		typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function"
			? globalThis.crypto.randomUUID()
			: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	const session: AgentSession = {
		id,
		openItemPath: null,
		cancelled: false,
		runChain: Promise.resolve(),
		activeRunController: null,
		processing: false,
		lastError: null,
		events: [],
		usage: {
			totalUsage: 0,
			lastTurnUsage: 0,
			contextUsagePercent: 0,
		},
	};
	sessions.set(id, session);
	return session;
}

export function getAgentSession(id: string): AgentSession | undefined {
	return sessions.get(id);
}

export function listAgentSessions(): Array<{
	sessionId: string;
	openItemPath: string | null;
	cancelled: boolean;
	processing: boolean;
	lastError: string | null;
	events: AgentEvent[];
	usage: AgentUsage;
}> {
	return Array.from(sessions.values()).map((session) => ({
		sessionId: session.id,
		openItemPath: session.openItemPath,
		cancelled: session.cancelled,
		processing: session.processing,
		lastError: session.lastError,
		events: session.events,
		usage: session.usage,
	}));
}

export function restoreAgentSessions(items: AgentSession[]): void {
	for (const session of sessions.values()) {
		abortActiveSessionRun(session.id);
	}
	sessions.clear();
	for (const item of items) {
		if (!item?.id) continue;
		const existing = sessions.get(item.id);
		const next: AgentSession = {
			...item,
			usage: item.usage ?? { totalUsage: 0, lastTurnUsage: 0, contextUsagePercent: 0 },
			runChain: item.runChain ?? Promise.resolve(),
			activeRunController: null,
		};
		if (existing) {
			next.runChain = existing.runChain;
		}
		sessions.set(next.id, next);
	}
}

export function abortActiveSessionRun(id: string): boolean {
	const session = sessions.get(id);
	const controller = session?.activeRunController;
	if (!controller) return false;
	controller.abort("cancelled_by_user");
	if (session) {
		session.activeRunController = null;
	}
	return true;
}

export function setSessionCancelled(id: string, cancelled: boolean): void {
	const s = sessions.get(id);
	if (s) s.cancelled = cancelled;
}

export function deleteAgentSession(id: string): void {
	abortActiveSessionRun(id);
	sessions.delete(id);
}
