import { ResponseKind } from "@app/types/ResponseKind";
import assert from "assert";
import { Command } from "../../../types/Command";

const browserReveal: Command<{ sessionId: string }, unknown> = Command.create({
	path: "agent/browser/reveal",

	kind: ResponseKind.json,

	async do({ sessionId }) {
		const session = this._app.agentManager.sessions.get(sessionId);
		assert(session, "agent/browser/reveal: session_not_found");
		const meta = await this._app.agentManager.browserHost.reveal(sessionId);
		session.browser = meta;
		return meta;
	},

	params(_ctx, q, body) {
		const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : q;
		return { sessionId: String(payload.sessionId ?? "") };
	},
});

export default browserReveal;
