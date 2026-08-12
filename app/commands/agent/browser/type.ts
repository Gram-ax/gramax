import { ResponseKind } from "@app/types/ResponseKind";
import { ensureBrowserSession, markBrowserSessionActive } from "@ext/agent/browser/browserSession";
import assert from "assert";
import { Command } from "../../../types/Command";

const browserType: Command<{ sessionId: string; elementId: string; text: string }, unknown> = Command.create({
	path: "agent/browser/type",

	kind: ResponseKind.json,

	async do({ sessionId, elementId, text }) {
		const session = this._app.agentManager.sessions.get(sessionId);
		assert(session, "agent/browser/type: session_not_found");
		assert(elementId.trim(), "agent/browser/type: empty_element_id");
		const host = this._app.agentManager.browserHost;
		await ensureBrowserSession(session, host);
		return markBrowserSessionActive(session, await host.type(sessionId, elementId.trim(), text));
	},

	params(_ctx, q, body) {
		const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : q;
		return {
			sessionId: String(payload.sessionId ?? ""),
			elementId: String(payload.elementId ?? ""),
			text: String(payload.text ?? ""),
		};
	},
});

export default browserType;
