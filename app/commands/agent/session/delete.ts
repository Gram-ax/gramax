import { ResponseKind } from "@app/types/ResponseKind";
import { Command } from "../../../types/Command";

const sessionDelete: Command<{ sessionId: string }, { ok: true; deleted: true; cancelled: boolean }> = Command.create({
	path: "agent/session/delete",

	kind: ResponseKind.json,

	async do({ sessionId }) {
		await this._app.agentManager.browserHost.teardown(sessionId);
		const cancelled = await this._app.agentManager.sessions.delete(sessionId);
		return { ok: true as const, deleted: true as const, cancelled };
	},

	params(_ctx, q) {
		return { sessionId: String(q.sessionId ?? "") };
	},
});

export default sessionDelete;
