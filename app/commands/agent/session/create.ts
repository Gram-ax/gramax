import { ResponseKind } from "@app/types/ResponseKind";
import { createAgentSession } from "@ext/agent/core/sessionStore";
import { Command } from "../../../types/Command";

const createSession: Command<Record<string, never>, { sessionId: string }> = Command.create({
	path: "agent/session/create",

	kind: ResponseKind.json,

	async do() {
		const session = createAgentSession();
		return { sessionId: session.id };
	},

	params() {
		return {};
	},
});

export default createSession;
