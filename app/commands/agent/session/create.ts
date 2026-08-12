import { ResponseKind } from "@app/types/ResponseKind";
import type { AgentSession } from "@ext/agent/core/session";
import { Command } from "../../../types/Command";

const createSession: Command<Record<string, never>, ReturnType<AgentSession["toSnapshot"]>> = Command.create({
	path: "agent/session/create",

	kind: ResponseKind.json,

	async do() {
		const session = await this._app.agentManager.sessions.create();
		return session.toSnapshot();
	},

	params() {
		return {};
	},
});

export default createSession;
