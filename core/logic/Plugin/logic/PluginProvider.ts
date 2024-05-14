import { CommandTree } from "@app/commands";
import Library from "@core/Library/Library";
import { Plugin } from "@core/Plugin";
import BrowserPluginImporter from "@core/Plugin/PluginImporter/logic/BrowserPluginImporter";
import NextPluginImporter from "@core/Plugin/PluginImporter/logic/NextPluginImporter";
import PluginImporterType from "@core/Plugin/PluginImporter/logic/PluginImporterType";
import PluginImporter from "@core/Plugin/PluginImporter/model/PluginImporter";
import PApplicationProvider from "@core/Plugin/logic/PApplicationProvider";
import PluginsCache from "@core/Plugin/logic/PluginsCache";
import PluginConfig from "@core/Plugin/model/PluginConfig";
import Cache from "@ext/Cache";
import HtmlParser from "@ext/html/HtmlParser";

export default class PluginProvider {
	hasInit = false;
	hasAddedLocals = false;

	private _plugins: Plugin[] = [];
	private _pApplicationProvider: PApplicationProvider;
	private _pluginImporter: PluginImporter;
	private _pluginsCache: PluginsCache;

	constructor(lib: Library, htmlParser: HtmlParser, baseCache: Cache, pluginImporterType: PluginImporterType) {
		this._pluginsCache = new PluginsCache(baseCache);
		this._pApplicationProvider = new PApplicationProvider(lib, htmlParser, this._pluginsCache);
		this._pluginImporter = this._createPluginImporter(pluginImporterType);
	}

	get plugins() {
		return this._plugins;
	}

	async initPlugins(commands: CommandTree): Promise<void> {
		for (const pluginConfig of await this._getPluginList()) {
			const plugin = await this._pluginImporter.importPlugin(pluginConfig, commands);
			if (plugin) this._plugins.push(plugin);
		}
	}

	async addPlugin(pluginConfig: PluginConfig, commands: CommandTree): Promise<boolean> {
		const plugin = await this._pluginImporter.importPlugin(pluginConfig, commands);
		if (!plugin) return false;
		await this.addInPluginList(pluginConfig);
		return true;
	}

	async deletePlugin(pluginName: string, commands: CommandTree): Promise<boolean> {
		const pluginList = await this._getPluginList();
		await this._pluginsCache.setPluginList(pluginList.filter((x) => x.name !== pluginName));
		await this._pluginsCache.deletePlugin(pluginName);
		const plugin = this._plugins.find((x) => x.name === pluginName);
		if (!plugin) return false;
		await plugin.onUnload();
		delete commands.plugin.plugins[pluginName];
		this._plugins.filter((x) => x.name === pluginName);
		return true;
	}

	async addInPluginList(pluginConfig: PluginConfig): Promise<boolean> {
		const pluginList = await this._getPluginList();
		if (pluginList.some((c) => c.name === pluginConfig.name)) {
			// console.error(`A plugin "${pluginConfig.name}" already exists`);
			return false;
		}
		if (pluginList.some((c) => c.url === pluginConfig.url)) {
			// console.error(`A plugin with "${pluginConfig.url}" url already exists`);
			return false;
		}
		pluginList.push(pluginConfig);
		await this._pluginsCache.setPluginList(pluginList);
		return true;
	}

	private _createPluginImporter(pluginImporterType: PluginImporterType): PluginImporter {
		return pluginImporterType == PluginImporterType.next
			? new NextPluginImporter(this._pluginsCache, this._pApplicationProvider)
			: new BrowserPluginImporter(this._pluginsCache, this._pApplicationProvider);
	}

	private async _getPluginList(): Promise<PluginConfig[]> {
		if (!(await this._pluginsCache.existPluginList())) {
			await this._pluginsCache.setPluginList([]);
			return [];
		}
		return this._pluginsCache.getPluginList();
	}
}
