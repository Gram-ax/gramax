import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ResponseKind } from "@app/types/ResponseKind";
import { Command } from "../../types/Command";

const setGesCloudUrl: Command<{ gesCloudUrl: string }, void> = Command.create({
	path: "enterpriseCloud/setGesCloudUrl",

	kind: ResponseKind.none,

	async do({ gesCloudUrl }) {
		const isTauri = getExecutingEnvironment() === "tauri";
		if (!isTauri || !gesCloudUrl) return;
		await this._app.enterpriseCloudManager.setGesCloudUrl(gesCloudUrl);
	},

	params(_, q) {
		return { gesCloudUrl: q.gesCloudUrl };
	},
});

export default setGesCloudUrl;
