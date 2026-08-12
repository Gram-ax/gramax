import { ResponseKind } from "@app/types/ResponseKind";
import { ensureBrowserSession, markBrowserSessionActive } from "@ext/agent/browser/browserSession";
import assert from "assert";
import { Command } from "../../../types/Command";

const browserScroll: Command<{ sessionId: string }, unknown> = Command.create({
	path: "agent/browser/scroll",

	kind: ResponseKind.json,

	async do({ sessionId }) {
		const session = this._app.agentManager.sessions.get(sessionId);
		assert(session, "agent/browser/scroll: session_not_found");
		const host = this._app.agentManager.browserHost;
		await ensureBrowserSession(session, host);
		return markBrowserSessionActive(session, await host.scroll(sessionId));
	},

	params(_ctx, q, body) {
		const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : q;
		return { sessionId: String(payload.sessionId ?? "") };
	},
});

export default browserScroll;
