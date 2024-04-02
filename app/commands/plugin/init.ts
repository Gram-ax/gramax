import { ResponseKind } from "@app/types/ResponseKind";
import { SilentMiddleware } from "@core/Api/middleware/SilentMiddleware";
import { Command } from "../../types/Command";

const init: Command<void, void> = Command.create({
	path: "plugin/init",

	kind: ResponseKind.none,

	middlewares: [new SilentMiddleware()],

	async do() {
		const { pluginProvider, logger } = this._app;
		if (pluginProvider.hasInit) return;
		await pluginProvider.initPlugins(this._commands);
		pluginProvider.hasInit = true;
		if (pluginProvider.plugins.length == 0) return;
		logger.logInfo("All plugins are loaded");
	},
});

export default init;
