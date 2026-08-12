import { ResponseKind } from "@app/types/ResponseKind";
import { ensureBrowserSession, markBrowserSessionActive } from "@ext/agent/browser/browserSession";
import assert from "assert";
import { Command } from "../../../types/Command";

const browserClick: Command<{ sessionId: string; elementId: string }, unknown> = Command.create({
	path: "agent/browser/click",

	kind: ResponseKind.json,

	async do({ sessionId, elementId }) {
		const session = this._app.agentManager.sessions.get(sessionId);
		assert(session, "agent/browser/click: session_not_found");
		assert(elementId.trim(), "agent/browser/click: empty_element_id");
		const host = this._app.agentManager.browserHost;
		await ensureBrowserSession(session, host);
		return markBrowserSessionActive(session, await host.click(sessionId, elementId.trim()));
	},

	params(_ctx, q, body) {
		const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : q;
		return {
			sessionId: String(payload.sessionId ?? ""),
			elementId: String(payload.elementId ?? ""),
		};
	},
});

export default browserClick;
