import { ResponseKind } from "@app/types/ResponseKind";
import type { AgentSession } from "@ext/agent/core/session";
import { Command } from "../../../types/Command";

const sessionList: Command<
	Record<string, never>,
	{ sessions: ReturnType<AgentSession["toSnapshot"]>[] }
> = Command.create({
	path: "agent/session/list",

	kind: ResponseKind.json,

	async do() {
		return { sessions: await this._app.agentManager.sessions.list() };
	},

	params() {
		return {};
	},
});

export default sessionList;
