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
		const pluginListUrl = "/plugins/pluginList.json";
		const res = await fetch(`${isNext ? ctx.domain : ""}${this._app.conf.basePath.value ?? ""}${pluginListUrl}`);
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
