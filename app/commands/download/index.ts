import { ResponseKind } from "@app/types/ResponseKind";
import { getDownloadUrl } from "@core/utils/appUtils";
import { Command } from "../../types/Command";

const download: Command<{ platform: string; isDev: boolean }, string> = Command.create({
	path: "download",

	kind: ResponseKind.redirect,

	async do({ platform, isDev }) {
		return await getDownloadUrl(isDev, platform);
	},

	params(ctx, q) {
		const platform = q.platform;
		const isDev = q.isDev == "true";
		return { ctx, platform, isDev };
	},
});

export default download;
