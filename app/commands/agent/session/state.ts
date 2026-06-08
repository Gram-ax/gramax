import { ResponseKind } from "@app/types/ResponseKind";
import { getAgentSession } from "@ext/agent/core/sessionStore";
import assert from "assert";
import { Command } from "../../../types/Command";

const sessionState: Command<
	{ sessionId: string; openItemPath?: string | null },
	{
		sessionId: string;
		openItemPath: string | null | undefined;
		cancelled: boolean;
		processing: boolean;
		lastError: string | null;
		events: unknown[];
		usage: unknown;
	}
> = Command.create({
	path: "agent/session/state",

	kind: ResponseKind.json,

	async do({ sessionId, openItemPath }) {
		const s = getAgentSession(sessionId);
		assert(s, "agent/session/state: session_not_found");
		if (openItemPath !== undefined) {
			s.openItemPath = openItemPath;
		}
		return {
			sessionId: s.id,
			openItemPath: s.openItemPath,
			cancelled: s.cancelled,
			processing: s.processing,
			lastError: s.lastError,
			events: s.events,
			usage: s.usage,
		};
	},

	params(_ctx, q) {
		return {
			sessionId: String(q.sessionId ?? ""),
			openItemPath: q.openItemPath == null ? undefined : String(q.openItemPath),
		};
	},
});

export default sessionState;
