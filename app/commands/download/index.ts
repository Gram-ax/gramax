import { ResponseKind } from "@app/types/ResponseKind";
import { getDownloadUrl, getUrl } from "@core/utils/appUtils";
import { Command } from "../../types/Command";

const download: Command<{ platform: string; isDev: boolean; branch: string }, string> = Command.create({
	path: "download",

	kind: ResponseKind.redirect,

	async do({ platform, isDev, branch }) {
		if (branch) return await getUrl(platform, branch);
		return await getDownloadUrl(isDev, platform);
	},

	params(ctx, q) {
		const platform = q.platform;
		const isDev = q.isDev == "true";
		const branch = q.branch;
		return { ctx, platform, isDev, branch };
	},
});

export default download;
