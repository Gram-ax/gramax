import { ResponseKind } from "@app/types/ResponseKind";
import { listAgentSessions } from "@ext/agent/core/sessionStore";
import { Command } from "../../../types/Command";

const sessionList: Command<Record<string, never>, { sessions: ReturnType<typeof listAgentSessions> }> = Command.create({
	path: "agent/session/list",

	kind: ResponseKind.json,

	async do() {
		return { sessions: listAgentSessions() };
	},

	params() {
		return {};
	},
});

export default sessionList;
