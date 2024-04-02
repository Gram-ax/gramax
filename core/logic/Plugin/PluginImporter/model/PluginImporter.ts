import { CommandTree } from "@app/commands";
import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { PApplication, Plugin } from "@core/Plugin";
import PluginsCache from "@core/Plugin/logic/PluginsCache";
import PluginConfig from "@core/Plugin/model/PluginConfig";

export default abstract class PluginImporter {
	constructor(protected _pluginsCache: PluginsCache) {}

	abstract importPlugin(pluginConfig: PluginConfig, app: PApplication, commands: CommandTree): Promise<Plugin>;

	protected _addPluginCommand(pluginName: string, plugin: Plugin, app: PApplication, commands: CommandTree) {
		commands.plugin.plugins[pluginName] = {};
		plugin.commandConfigs.map((c) => {
			commands.plugin.plugins[pluginName][c.name] = Command.create({
				path: `plugin/plugins/${pluginName}/${c.name}`,
				kind: ResponseKind.json,
				do: async (props: any) => ({
					data: await c.do.bind({ app })(props),
				}),
				params(_, __, body) {
					return body;
				},
			});
		});
	}

	protected async _getPlugin(module: any, name: string, app: PApplication, commands: CommandTree): Promise<Plugin> {
		if (!module) return;
		const plugin = new module.default(app) as Plugin;
		if (!plugin) return;
		try {
			await plugin.onLoad();
		} catch (e) {
			console.error(`Error in ${plugin.name} plugin:\n`, e);
		}
		this._addPluginCommand(name, plugin, app, commands);
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
