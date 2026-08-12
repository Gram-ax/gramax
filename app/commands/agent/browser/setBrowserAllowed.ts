import { ResponseKind } from "@app/types/ResponseKind";
import { Command } from "../../../types/Command";

const setBrowserAllowed: Command<{ allowed: boolean }, unknown> = Command.create({
	path: "agent/browser/setBrowserAllowed",

	kind: ResponseKind.json,

	async do({ allowed }) {
		this._app.agentManager.browserAllowed = allowed;
		return { browserAllowed: allowed };
	},

	params(_ctx, q, body) {
		const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : q;
		return { allowed: !!payload.allowed };
	},
});

export default setBrowserAllowed;
