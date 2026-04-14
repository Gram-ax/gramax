import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ResponseKind } from "@app/types/ResponseKind";
import { Command } from "../../types/Command";

const setGesUrl: Command<{ gesUrl: string }, void> = Command.create({
	path: "enterprise/setGesUrl",

	kind: ResponseKind.none,

	async do({ gesUrl }) {
		const isTauri = getExecutingEnvironment() === "tauri";
		if (!isTauri || !gesUrl) return;
		await this._app.em.setGesUrl(gesUrl);
	},

	params(_, q) {
		return { gesUrl: q.gesUrl };
	},
});

export default setGesUrl;
