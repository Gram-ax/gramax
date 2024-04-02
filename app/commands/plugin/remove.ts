import { ResponseKind } from "@app/types/ResponseKind";
import { Command } from "../../types/Command";

const remove: Command<string, void> = Command.create({
	path: "plugin/remove",

	kind: ResponseKind.none,

	async do(pluginName) {
		const { pluginProvider, logger } = this._app;
		const res = await pluginProvider.deletePlugin(pluginName, this._commands);
		if (res) logger.logInfo(`Remove "${pluginName}" plugin`);
	},
});

export default remove;
