import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import PluginConfig from "@core/Plugin/model/PluginConfig";
import { Command } from "../../types/Command";

const add: Command<{ ctx: Context }, void> = Command.create({
	path: "plugin/addLocals",

	kind: ResponseKind.none,

	async do({ ctx }) {
		const { pluginProvider, logger } = this._app;
		if (pluginProvider.hasAddedLocals) return;
		const isNext = getExecutingEnvironment() === "next";
		const pluginListUrl = `${this._app.conf.basePath.value ?? ""}/plugins/pluginList.json`;

		let res: Response;
		try {
			res = await fetch(`${isNext ? ctx.domain : ""}${pluginListUrl}`);
		} catch (e) {
			const message = `Failed to load plugins. Please check if this URL is accessible: "${ctx.domain}${pluginListUrl}"`;
			const error = new Error(message, { cause: e });
			if (!isNext) throw error;
			console.error(error);
		}

		if (!res.ok || !res.headers.get("content-type").toLowerCase().includes("application/json")) {
			logger.logInfo("No plugins found");
			pluginProvider.hasAddedLocals = true;
			return;
		}
		const pluginsNames = (await res.json()) as PluginConfig[];
		for (const { url, name } of pluginsNames) {
			await pluginProvider.addInPluginList({ url, name });
			logger.logInfo(`Add "${name}" plugin`);
		}
		pluginProvider.hasAddedLocals = true;
	},

	params(ctx) {
		return { ctx };
	},
});

export default add;
