import { ResponseKind } from "@app/types/ResponseKind";
import assert from "assert";
import { Command } from "../../../types/Command";

const sessionCancel: Command<{ sessionId: string }, { ok: true; cancelled: boolean }> = Command.create({
	path: "agent/session/cancel",

	kind: ResponseKind.json,

	async do({ sessionId }) {
		const session = this._app.agentManager.sessions.get(sessionId);
		assert(session, "agent/session/cancel: session_not_found");
		const cancelled = this._app.agentManager.sessions.cancel(sessionId);
		return { ok: true as const, cancelled };
	},

	params(_ctx, q) {
		return { sessionId: String(q.sessionId ?? "") };
	},
});

export default sessionCancel;
