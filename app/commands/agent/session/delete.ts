import { ResponseKind } from "@app/types/ResponseKind";
import { abortActiveSessionRun, deleteAgentSession, getAgentSession } from "@ext/agent/core/sessionStore";
import assert from "assert";
import { Command } from "../../../types/Command";

const sessionDelete: Command<{ sessionId: string }, { ok: true; cancelled: boolean; deleted: true }> = Command.create({
	path: "agent/session/delete",

	kind: ResponseKind.json,

	async do({ sessionId }) {
		const session = getAgentSession(sessionId);
		assert(session, "agent/session/delete: session_not_found");
		const cancelled = abortActiveSessionRun(sessionId);
		deleteAgentSession(sessionId);
		return { ok: true as const, cancelled, deleted: true as const };
	},

	params(_ctx, q) {
		return { sessionId: String(q.sessionId ?? "") };
	},
});

export default sessionDelete;
