import { ResponseKind } from "@app/types/ResponseKind";
import { type AgentSession, restoreAgentSessions } from "@ext/agent/core/sessionStore";
import { getAgentLlmConfig } from "@ext/agent/llm/agentLlmConfig";
import { Command } from "../../../types/Command";

const sessionRestore: Command<
	{ sessions: AgentSession[]; activeSessionId?: string | null; apiKey?: string | null },
	{ restored: number; activeSessionId: string | null }
> = Command.create({
	path: "agent/session/restore",

	kind: ResponseKind.json,

	async do({ sessions, activeSessionId, apiKey }) {
		if (apiKey) {
			getAgentLlmConfig().setApiKey(apiKey);
		}
		restoreAgentSessions(
			sessions
				.filter((session): session is AgentSession => !!session?.id)
				.map((session) => ({
					...session,
					runChain: Promise.resolve(),
					activeRunController: null,
				})),
		);
		return { restored: sessions.length, activeSessionId: activeSessionId ?? null };
	},

	params(_ctx, _q, body) {
		const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
		return {
			sessions: Array.isArray(payload.sessions) ? (payload.sessions as AgentSession[]) : [],
			activeSessionId: payload.activeSessionId == null ? null : String(payload.activeSessionId),
			apiKey: payload.apiKey == null ? null : String(payload.apiKey),
		};
	},
});

export default sessionRestore;
