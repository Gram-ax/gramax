import { CommandTree } from "@app/commands";
import PluginImporter from "@core/Plugin/PluginImporter/model/PluginImporter";
import PluginsCache from "@core/Plugin/logic/PluginsCache";
import { PApplication } from "@core/Plugin/model/PApplication";
import { Plugin } from "@core/Plugin/model/Plugin";
import PluginConfig from "@core/Plugin/model/PluginConfig";

export default class BrowserPluginImporter extends PluginImporter {
	constructor(pluginsCache: PluginsCache) {
		super(pluginsCache);
	}

	async importPlugin(pluginConfig: PluginConfig, app: PApplication, commands: CommandTree): Promise<Plugin> {
		const isLocal = this._isPluginLocal(pluginConfig.url);
		if (isLocal) {
			const pluginSrc = await this._downloadPlugin(pluginConfig.url);
			const module = await this._getModule(pluginSrc);
			return this._getPlugin(module, pluginConfig.name, app, commands);
		}

		const existPluginSrc = await this._pluginsCache.existPluginSrc(pluginConfig.name);
		const pluginSrc = existPluginSrc
			? await this._pluginsCache.getPluginSrc(pluginConfig.name)
			: await this._downloadPlugin(pluginConfig.url);

		if (!pluginSrc) return;

		if (!existPluginSrc) await this._pluginsCache.setPluginSrc(pluginConfig.name, pluginSrc);

		const module = await this._getModule(pluginSrc);
		return this._getPlugin(module, pluginConfig.name, app, commands);
	}

	private async _getModule(src: string): Promise<any> {
		const blob = new Blob([src], { type: "text/javascript" });
		const url = URL.createObjectURL(blob);
		const module = await import(/* @vite-ignore */ url);
		URL.revokeObjectURL(url);
		return module;
	}
}
