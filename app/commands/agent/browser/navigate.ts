import { ResponseKind } from "@app/types/ResponseKind";
import { ensureBrowserSession, markBrowserSessionActive } from "@ext/agent/browser/browserSession";
import assert from "assert";
import { Command } from "../../../types/Command";

const browserNavigate: Command<{ sessionId: string; url: string }, unknown> = Command.create({
	path: "agent/browser/navigate",

	kind: ResponseKind.json,

	async do({ sessionId, url }) {
		const session = this._app.agentManager.sessions.get(sessionId);
		assert(session, "agent/browser/navigate: session_not_found");
		const target = url.trim();
		assert(target, "agent/browser/navigate: empty_url");
		assert(/^https?:\/\//i.test(target), "agent/browser/navigate: invalid_scheme");
		const host = this._app.agentManager.browserHost;
		await ensureBrowserSession(session, host);
		return markBrowserSessionActive(session, await host.navigate(sessionId, target));
	},

	params(_ctx, q, body) {
		const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : q;
		return {
			sessionId: String(payload.sessionId ?? ""),
			url: String(payload.url ?? ""),
		};
	},
});

export default browserNavigate;
