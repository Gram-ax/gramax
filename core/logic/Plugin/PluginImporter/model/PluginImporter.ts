import { CommandTree } from "@app/commands";
import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Plugin } from "@core/Plugin";
import PApplicationProvider from "@core/Plugin/logic/PApplicationProvider";
import PluginsCache from "@core/Plugin/logic/PluginsCache";
import PluginConfig from "@core/Plugin/model/PluginConfig";

export default abstract class PluginImporter {
	constructor(protected _pluginsCache: PluginsCache, protected _pApplicationProvider: PApplicationProvider) {}

	abstract importPlugin(pluginConfig: PluginConfig, commands: CommandTree): Promise<Plugin>;

	protected _addPluginCommand(pluginName: string, plugin: Plugin, commands: CommandTree) {
		const pApplicationProvider = this._pApplicationProvider;
		commands.plugin.plugins[pluginName] = {};
		plugin.commandConfigs.map((c) => {
			commands.plugin.plugins[pluginName][c.name] = Command.create<{ ctx: Context; props: any }, { data: any }>({
				path: `plugin/plugins/${pluginName}/${c.name}`,
				kind: ResponseKind.json,
				async do({ ctx, props }) {
					const app = await pApplicationProvider.getApp(pluginName, ctx);
					return { data: await c.do.bind({ app })(props) };
				},
				params(ctx, __, body) {
					return { ctx, props: body };
				},
			});
		});
	}

	protected async _getPlugin(module: any, name: string, commands: CommandTree): Promise<Plugin> {
		if (!module) return;
		const plugin = new module.default() as Plugin;
		if (!plugin) return;
		try {
			await plugin.onLoad();
		} catch (e) {
			console.error(`Error in ${plugin.name} plugin:\n`, e);
		}
		this._addPluginCommand(name, plugin, commands);
		return plugin;
	}

	protected async _downloadPlugin(url: string): Promise<string> {
		let res: Response;
		try {
			res = await fetch(url);
		} catch (e) {
			console.error(`Failed to access "${url}"`);
			return;
		}
		if (!res.ok) {
			console.error(`Error: status: ${res.status}, statusText: ${res.statusText}, url:${url}`);
			return;
		}
		return await res.text();
	}

	protected _isPluginLocal(url: string) {
		return url.startsWith("/");
	}
}
