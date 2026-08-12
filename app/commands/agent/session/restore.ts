import { ResponseKind } from "@app/types/ResponseKind";
import { Command } from "../../../types/Command";

const sessionRestore: Command<{ activeSessionId?: string | null }, { restored: number }> = Command.create({
	path: "agent/session/restore",

	kind: ResponseKind.json,

	async do({ activeSessionId }) {
		await this._app.agentManager.sessions.load(activeSessionId);
		return { restored: (await this._app.agentManager.sessions.list()).length };
	},

	params(_ctx, _q, body) {
		const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
		return {
			activeSessionId: payload.activeSessionId == null ? null : String(payload.activeSessionId),
		};
	},
});

export default sessionRestore;
