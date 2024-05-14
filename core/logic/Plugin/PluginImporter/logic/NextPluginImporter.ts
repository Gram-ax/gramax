import { CommandTree } from "@app/commands";
import PluginImporter from "@core/Plugin/PluginImporter/model/PluginImporter";
import PApplicationProvider from "@core/Plugin/logic/PApplicationProvider";
import PluginsCache from "@core/Plugin/logic/PluginsCache";
import { Plugin } from "@core/Plugin/model/Plugin";
import PluginConfig from "@core/Plugin/model/PluginConfig";

export default class NextPluginImporter extends PluginImporter {
	constructor(pluginsCache: PluginsCache, pApplicationProvider: PApplicationProvider) {
		super(pluginsCache, pApplicationProvider);
	}

	async importPlugin(pluginConfig: PluginConfig, commands: CommandTree): Promise<Plugin> {
		const isLocal = this._isPluginLocal(pluginConfig.url);
		if (isLocal) {
			const module = await import(/* @vite-ignore */ `@public/plugins/${pluginConfig.name}.js`);
			return this._getPlugin(module, pluginConfig.name, commands);
		}

		if (!(await this._pluginsCache.existPluginSrc(pluginConfig.name))) {
			const pluginSrc = await this._downloadPlugin(pluginConfig.url);
			if (!pluginSrc) return;
			await this._pluginsCache.setPluginSrc(pluginConfig.name, pluginSrc);
		}
		const module = await import(/* @vite-ignore */ `@pluginCache/${pluginConfig.name}/src/bundle`);
		return this._getPlugin(module, pluginConfig.name, commands);
	}
}
