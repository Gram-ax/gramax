import { ResponseKind } from "@app/types/ResponseKind";
import PluginConfig from "@core/Plugin/model/PluginConfig";
import { Command } from "../../types/Command";

const add: Command<{ pluginConfig: PluginConfig }, void> = Command.create({
	path: "plugin/add",

	kind: ResponseKind.none,

	async do({ pluginConfig }) {
		const { pluginProvider, logger } = this._app;
		const plugin = await pluginProvider.addPlugin(pluginConfig, this._commands);
		if (!plugin) return;
		logger.logInfo(`Add "${pluginConfig.name}" plugin`);
	},

	params(_, __, body) {
		return { pluginConfig: body };
	},
});

export default add;
