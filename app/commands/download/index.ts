import { getDownloadUrl, getServerVersion } from "@core/utils/appUtils";
import { Command, ResponseKind } from "../../types/Command";

const download: Command<{ platform: string; isDev: boolean }, string> = Command.create({
	path: "download",

	kind: ResponseKind.redirect,

	async do({ platform, isDev }) {
		const version = await getServerVersion(isDev);
		const url = getDownloadUrl(isDev, platform, version);
		return url;
	},

	params(ctx, q) {
		const platform = q.platform;
		const isDev = q.isDev == "true";
		return { ctx, platform, isDev };
	},
});

export default download;
