import PluginConfig from "@core/Plugin/model/PluginConfig";
import Cache from "@ext/Cache";

const PLUGINS_STORAGE_PROVIDER_KEY_NAME = "plugins";
const PLUGIN_LIST_CACHE_NAME = "pluginList.json";
const SRC_KEY_NAME = "src";
const STORAGE_KEY_NAME = "storage";
const SRC_FILE_NAME = "bundle";

export default class PluginsCache {
	constructor(private _baseCache: Cache) {}

	async getPluginStorage(pluginName: string): Promise<Cache> {
		return (await this._getPluginNameStorage(pluginName)).storage;
	}

	async setPluginSrc(pluginName: string, src: string): Promise<void> {
		const pluginNameStorage = await this._getPluginNameStorage(pluginName);
		await pluginNameStorage.src.set(SRC_FILE_NAME, src);
	}

	async getPluginSrc(pluginName: string): Promise<string> {
		const pluginNameStorage = await this._getPluginNameStorage(pluginName);
		return pluginNameStorage.src.get(SRC_FILE_NAME);
	}

	async existPluginSrc(pluginName: string): Promise<boolean> {
		const pluginNameStorage = await this._getPluginNameStorage(pluginName);
		return pluginNameStorage.src.exists(SRC_FILE_NAME);
	}

	async setPluginList(pluginList: PluginConfig[]): Promise<void> {
		const pluginsStorage = await this._getPluginsStorage();
		return pluginsStorage.set(PLUGIN_LIST_CACHE_NAME, JSON.stringify(pluginList));
	}

	async getPluginList(): Promise<PluginConfig[]> {
		const pluginsStorage = await this._getPluginsStorage();
		return JSON.parse(await pluginsStorage.get(PLUGIN_LIST_CACHE_NAME));
	}

	async existPluginList(): Promise<boolean> {
		const pluginsStorage = await this._getPluginsStorage();
		return pluginsStorage.exists(PLUGIN_LIST_CACHE_NAME);
	}

	async deletePlugin(pluginName: string): Promise<void> {
		return (await this._getPluginsStorage()).delete(pluginName);
	}

	private async _getPluginNameStorage(pluginName: string): Promise<{ src: Cache; storage: Cache }> {
		const pluginsStorage = await this._getPluginsStorage();

		const pluginNameStorage = await pluginsStorage.getComplex(pluginName);
		return {
			src: await pluginNameStorage.getComplex(SRC_KEY_NAME),
			storage: await pluginNameStorage.getComplex(STORAGE_KEY_NAME),
		};
	}

	private async _getPluginsStorage() {
		return this._baseCache.getComplex(PLUGINS_STORAGE_PROVIDER_KEY_NAME);
	}
}
