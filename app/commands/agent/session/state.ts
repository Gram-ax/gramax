import { ResponseKind } from "@app/types/ResponseKind";
import type { AgentBrowserSessionMeta } from "@ext/agent/browser/browserHost";
import type { AgentEvent } from "@ext/agent/core/events";
import type { AgentUsage } from "@ext/agent/core/session";
import assert from "assert";
import { Command } from "../../../types/Command";

const sessionState: Command<
	{ sessionId: string; openCatalogName: string | null; openItemPath: string | null },
	{
		id: string;
		title: string;
		openCatalogName: string | null;
		openItemPath: string | null;
		cancelled: boolean;
		processing: boolean;
		lastError: string | null;
		events: AgentEvent[];
		usage: AgentUsage;
		browser: AgentBrowserSessionMeta;
	}
> = Command.create({
	path: "agent/session/state",

	kind: ResponseKind.json,

	async do({ sessionId, openItemPath, openCatalogName }) {
		const s = this._app.agentManager.sessions.get(sessionId);
		assert(s, "agent/session/state: session_not_found");
		s.openCatalogName = openCatalogName;
		s.openItemPath = openItemPath;
		return {
			id: s.id,
			title: s.title,
			openCatalogName: s.openCatalogName,
			openItemPath: s.openItemPath,
			cancelled: s.cancelled,
			processing: s.processing,
			lastError: s.lastError,
			events: s.events,
			usage: s.usage,
			browser: s.browser,
		};
	},

	params(_ctx, q) {
		return {
			sessionId: String(q.sessionId ?? ""),
			openCatalogName: q.openCatalogName ? String(q.openCatalogName) : null,
			openItemPath: q.openItemPath ? String(q.openItemPath) : null,
		};
	},
});

export default sessionState;
