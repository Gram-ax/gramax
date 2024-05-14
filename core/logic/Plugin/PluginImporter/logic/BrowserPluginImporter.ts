import { CommandTree } from "@app/commands";
import PluginImporter from "@core/Plugin/PluginImporter/model/PluginImporter";
import PApplicationProvider from "@core/Plugin/logic/PApplicationProvider";
import PluginsCache from "@core/Plugin/logic/PluginsCache";
import { Plugin } from "@core/Plugin/model/Plugin";
import PluginConfig from "@core/Plugin/model/PluginConfig";

export default class BrowserPluginImporter extends PluginImporter {
	constructor(pluginsCache: PluginsCache, pApplicationProvider: PApplicationProvider) {
		super(pluginsCache, pApplicationProvider);
	}

	async importPlugin(pluginConfig: PluginConfig, commands: CommandTree): Promise<Plugin> {
		const isLocal = this._isPluginLocal(pluginConfig.url);
		if (isLocal) {
			const pluginSrc = await this._downloadPlugin(pluginConfig.url);
			const module = await this._getModule(pluginSrc);
			return this._getPlugin(module, pluginConfig.name, commands);
		}

		const existPluginSrc = await this._pluginsCache.existPluginSrc(pluginConfig.name);
		const pluginSrc = existPluginSrc
			? await this._pluginsCache.getPluginSrc(pluginConfig.name)
			: await this._downloadPlugin(pluginConfig.url);

		if (!pluginSrc) return;

		if (!existPluginSrc) await this._pluginsCache.setPluginSrc(pluginConfig.name, pluginSrc);

		const module = await this._getModule(pluginSrc);
		return this._getPlugin(module, pluginConfig.name, commands);
	}

	private async _getModule(src: string): Promise<any> {
		const blob = new Blob([src], { type: "text/javascript" });
		const url = URL.createObjectURL(blob);
		const module = await import(/* @vite-ignore */ url);
		URL.revokeObjectURL(url);
		return module;
	}
}
