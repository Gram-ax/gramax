import { ResponseKind } from "@app/types/ResponseKind";
import type { AgentDraftSnapshot } from "@ext/agent/components/types/chat";
import assert from "assert";
import { Command } from "../../../types/Command";

const sessionDraft: Command<{ sessionId: string }, AgentDraftSnapshot | null> = Command.create({
	path: "agent/session/draft",

	kind: ResponseKind.json,

	async do({ sessionId }) {
		const session = this._app.agentManager.sessions.get(sessionId);
		assert(session, "agent/session/draft: session_not_found");
		return this._app.agentManager.sessions.loadDraft(sessionId);
	},

	params(_ctx, q) {
		return { sessionId: String(q.sessionId ?? "") };
	},
});

export default sessionDraft;
