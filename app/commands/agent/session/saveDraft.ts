import { ResponseKind } from "@app/types/ResponseKind";
import type { AgentDraftSnapshot } from "@ext/agent/components/types/chat";
import assert from "assert";
import { Command } from "../../../types/Command";

const sessionSaveDraft: Command<{ sessionId: string; draft: AgentDraftSnapshot }, { ok: true }> = Command.create({
	path: "agent/session/saveDraft",

	kind: ResponseKind.json,

	async do({ sessionId, draft }) {
		const session = this._app.agentManager.sessions.get(sessionId);
		assert(session, "agent/session/saveDraft: session_not_found");
		await this._app.agentManager.sessions.saveDraft(sessionId, draft);
		return { ok: true as const };
	},

	params(_ctx, _q, body) {
		const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
		return {
			sessionId: String(payload.sessionId ?? ""),
			draft: payload.draft as AgentDraftSnapshot,
		};
	},
});

export default sessionSaveDraft;
